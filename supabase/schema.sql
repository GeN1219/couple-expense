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

-- household_groups: メンバーのみ参照可。招待コード検索は誰でも可
CREATE POLICY "Members can view their groups"
  ON household_groups FOR SELECT
  USING (
    id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Authenticated users can create groups"
  ON household_groups FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- 招待コードでの検索用（参加時に使う）
CREATE POLICY "Anyone can lookup by invite code"
  ON household_groups FOR SELECT
  USING (true);

-- group_members: 同じグループのメンバーのみ
CREATE POLICY "Members can view group members"
  ON group_members FOR SELECT
  USING (
    group_id IN (SELECT group_id FROM group_members AS gm WHERE gm.user_id = auth.uid())
  );

CREATE POLICY "Authenticated users can join groups"
  ON group_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

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
