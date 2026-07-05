-- ========================================
-- ふたりの家計簿 - Supabase Schema
-- ========================================
-- Supabase Dashboard > SQL Editor で実行してください

-- 1. UUID拡張の有効化
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. 家計簿グループ
CREATE TABLE household_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. グループメンバー
CREATE TABLE group_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES household_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- 4. 支出記録
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES household_groups(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  payer TEXT NOT NULL,
  item TEXT NOT NULL,
  amount INTEGER NOT NULL CHECK (amount > 0),
  category TEXT NOT NULL,
  settled BOOLEAN DEFAULT FALSE,
  settled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. カテゴリ設定
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES household_groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. インデックス
CREATE INDEX idx_expenses_group_id ON expenses(group_id);
CREATE INDEX idx_expenses_date ON expenses(group_id, date DESC);
CREATE INDEX idx_group_members_user_id ON group_members(user_id);
CREATE INDEX idx_group_members_group_id ON group_members(group_id);
CREATE INDEX idx_categories_group_id ON categories(group_id);

-- ========================================
-- Row Level Security (RLS)
-- ========================================

ALTER TABLE household_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- 再帰回避用ヘルパー: ログインユーザーの所属グループIDを返す。
-- SECURITY DEFINER で group_members のRLSをバイパスするため、
-- group_members 自身のポリシーから呼んでも無限再帰にならない。
CREATE OR REPLACE FUNCTION public.current_user_group_ids()
RETURNS SETOF uuid
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$ SELECT group_id FROM public.group_members WHERE user_id = auth.uid() $$;

-- household_groups: メンバーのみ参照可。招待コード検索は誰でも可
DROP POLICY IF EXISTS "Members can view their groups" ON household_groups;
CREATE POLICY "Members can view their groups"
  ON household_groups FOR SELECT
  USING (id IN (SELECT current_user_group_ids()));

CREATE POLICY "Authenticated users can create groups"
  ON household_groups FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- 招待コードでの検索用（参加時に使う）
CREATE POLICY "Anyone can lookup by invite code"
  ON household_groups FOR SELECT
  USING (true);

-- household_groups: メンバーのみグループ名を更新可能
DROP POLICY IF EXISTS "Members can update their groups" ON household_groups;
CREATE POLICY "Members can update their groups"
  ON household_groups FOR UPDATE
  USING (id IN (SELECT current_user_group_ids()));

-- group_members: 同じグループのメンバーのみ（自己参照を避けるため関数を使用）
DROP POLICY IF EXISTS "Members can view group members" ON group_members;
CREATE POLICY "Members can view group members"
  ON group_members FOR SELECT
  USING (group_id IN (SELECT current_user_group_ids()));

CREATE POLICY "Authenticated users can join groups"
  ON group_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- group_members: 表示名の変更(UPDATE)用
DROP POLICY IF EXISTS "Members can update group members" ON group_members;
CREATE POLICY "Members can update group members"
  ON group_members FOR UPDATE
  USING (group_id IN (SELECT current_user_group_ids()));

CREATE POLICY "Members can leave groups"
  ON group_members FOR DELETE
  USING (auth.uid() = user_id);

-- expenses: 同グループメンバーのみ CRUD
CREATE POLICY "Members can view group expenses"
  ON expenses FOR SELECT
  USING (
    group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Members can insert expenses"
  ON expenses FOR INSERT
  WITH CHECK (
    group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Members can update expenses"
  ON expenses FOR UPDATE
  USING (
    group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Members can delete expenses"
  ON expenses FOR DELETE
  USING (
    group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
  );

-- categories: 同グループメンバーのみ CRUD
CREATE POLICY "Members can view categories"
  ON categories FOR SELECT
  USING (
    group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Members can insert categories"
  ON categories FOR INSERT
  WITH CHECK (
    group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Members can delete categories"
  ON categories FOR DELETE
  USING (
    group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
  );

-- ========================================
-- Realtime 有効化
-- ========================================

ALTER PUBLICATION supabase_realtime ADD TABLE expenses;
ALTER PUBLICATION supabase_realtime ADD TABLE categories;
ALTER PUBLICATION supabase_realtime ADD TABLE group_members;

-- ========================================
-- 固定費（毎月の定期支出）機能  ※既存DBに後から適用する追加分
-- この節は冪等（何度実行してもOK）に書いてあります
-- ========================================

-- 7. 固定費ルール
CREATE TABLE IF NOT EXISTS recurring_expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES household_groups(id) ON DELETE CASCADE,
  day INTEGER NOT NULL CHECK (day BETWEEN 1 AND 31),
  payer TEXT NOT NULL,
  item TEXT NOT NULL,
  amount INTEGER NOT NULL CHECK (amount > 0),
  category TEXT NOT NULL,
  start_ym TEXT NOT NULL,          -- 生成開始月 'YYYY-MM'
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- expenses に「どの固定費が・どの月分を」生成したかのマーカー列を追加
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS recurring_id UUID
  REFERENCES recurring_expenses(id) ON DELETE SET NULL;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS recurring_month TEXT;  -- 'YYYY-MM'

-- 重複生成防止: 同じルール×同じ月は1件だけ（二人同時起動でも安全）
CREATE UNIQUE INDEX IF NOT EXISTS idx_expenses_recurring_unique
  ON expenses(recurring_id, recurring_month)
  WHERE recurring_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_recurring_group_id ON recurring_expenses(group_id);

-- RLS
ALTER TABLE recurring_expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view recurring" ON recurring_expenses;
CREATE POLICY "Members can view recurring"
  ON recurring_expenses FOR SELECT
  USING (group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Members can insert recurring" ON recurring_expenses;
CREATE POLICY "Members can insert recurring"
  ON recurring_expenses FOR INSERT
  WITH CHECK (group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Members can update recurring" ON recurring_expenses;
CREATE POLICY "Members can update recurring"
  ON recurring_expenses FOR UPDATE
  USING (group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Members can delete recurring" ON recurring_expenses;
CREATE POLICY "Members can delete recurring"
  ON recurring_expenses FOR DELETE
  USING (group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid()));

-- Realtime（既に追加済みならエラーになるので個別に握りつぶす）
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE recurring_expenses;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
