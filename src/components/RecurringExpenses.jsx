import { useState } from 'react';
import { FiPlusCircle, FiEdit2, FiTrash2, FiCheck, FiX, FiRepeat } from 'react-icons/fi';
import { formatCurrency } from '../utils/calc';
import { currentYm } from '../utils/recurring';

const EMPTY = (settings) => ({
  day: 25,
  payer: settings.users[0] || '',
  item: '',
  amount: '',
  category: settings.categories[0] || '',
});

function PayerSelector({ value, users, onChange }) {
  return (
    <div>
      <div className="flex gap-2 mb-2">
        {users.map((user) => (
          <button
            key={user}
            type="button"
            onClick={() => onChange(user)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              value === user
                ? 'bg-beige-dark text-white shadow-md'
                : 'bg-cream border border-beige text-brown hover:bg-cream-dark'
            }`}
          >
            {user}
          </button>
        ))}
      </div>
      <p className="text-xs text-warm-gray mb-1.5">個人の支出（割り勘対象外）</p>
      <div className="flex gap-2">
        {users.map((user) => (
          <button
            key={`${user}のみ`}
            type="button"
            onClick={() => onChange(`${user}のみ`)}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              value === `${user}のみ`
                ? 'bg-brown text-white shadow-md'
                : 'bg-white border border-beige-dark/40 text-brown/60 hover:bg-cream'
            }`}
          >
            {user}のみ
          </button>
        ))}
      </div>
    </div>
  );
}

function RuleForm({ settings, initial, submitLabel, onSubmit, onCancel }) {
  const [form, setForm] = useState(initial);
  const set = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  const submit = (e) => {
    e.preventDefault();
    const amount = parseInt(form.amount, 10);
    const day = parseInt(form.day, 10);
    if (!form.item.trim() || !amount || amount <= 0) return;
    if (!day || day < 1 || day > 31) return;
    onSubmit({
      day,
      payer: form.payer,
      item: form.item.trim(),
      amount,
      category: form.category,
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {/* 毎月◯日 */}
      <div>
        <label className="block text-sm font-medium text-brown mb-1">毎月の支払日</label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-brown">毎月</span>
          <input
            type="number"
            inputMode="numeric"
            min="1"
            max="31"
            value={form.day}
            onChange={(e) => set('day', e.target.value)}
            className="w-20 px-3 py-2.5 rounded-xl border border-beige bg-white text-brown-dark text-center focus:outline-none focus:ring-2 focus:ring-beige-dark/50"
          />
          <span className="text-sm text-brown">日</span>
        </div>
        <p className="text-xs text-warm-gray mt-1">
          31日など存在しない月はその月の末日に調整されます
        </p>
      </div>

      {/* 支払者 */}
      <div>
        <label className="block text-sm font-medium text-brown mb-1">支払う人</label>
        <PayerSelector value={form.payer} users={settings.users} onChange={(v) => set('payer', v)} />
      </div>

      {/* 項目名 */}
      <div>
        <label className="block text-sm font-medium text-brown mb-1">項目名</label>
        <input
          type="text"
          value={form.item}
          onChange={(e) => set('item', e.target.value)}
          placeholder="例: 家賃"
          className="w-full px-3 py-2.5 rounded-xl border border-beige bg-white text-brown-dark placeholder-warm-gray focus:outline-none focus:ring-2 focus:ring-beige-dark/50"
        />
      </div>

      {/* 金額 */}
      <div>
        <label className="block text-sm font-medium text-brown mb-1">金額</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray text-sm">¥</span>
          <input
            type="number"
            inputMode="numeric"
            min="1"
            value={form.amount}
            onChange={(e) => set('amount', e.target.value)}
            placeholder="0"
            className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-beige bg-white text-brown-dark placeholder-warm-gray focus:outline-none focus:ring-2 focus:ring-beige-dark/50"
          />
        </div>
      </div>

      {/* カテゴリ */}
      <div>
        <label className="block text-sm font-medium text-brown mb-1">カテゴリ</label>
        <div className="flex flex-wrap gap-2">
          {settings.categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => set('category', cat)}
              className={`px-3 py-1.5 rounded-full text-sm transition-all duration-200 ${
                form.category === cat
                  ? 'bg-beige-dark text-white shadow-sm'
                  : 'bg-cream border border-beige text-brown hover:bg-cream-dark'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          className="flex-1 py-3 rounded-xl bg-beige-dark text-white font-bold text-base shadow-md hover:bg-brown transition-colors duration-200 flex items-center justify-center gap-2"
        >
          <FiCheck /> {submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-3 rounded-xl bg-cream border border-beige text-warm-gray hover:bg-cream-dark transition-colors flex items-center gap-1"
          >
            <FiX /> 取消
          </button>
        )}
      </div>
    </form>
  );
}

export default function RecurringExpenses({ settings, recurring, onAdd, onEdit, onDelete }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const rules = [...recurring].sort((a, b) => a.day - b.day);

  const handleAdd = (rule) => {
    onAdd({ ...rule, start_ym: currentYm(), active: true });
    setShowForm(false);
  };

  const handleEditSave = (id) => (rule) => {
    onEdit(id, rule);
    setEditingId(null);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-brown-dark flex items-center gap-2">
          <FiRepeat /> 固定費
        </h2>
        {!showForm && (
          <button
            onClick={() => { setShowForm(true); setEditingId(null); }}
            className="px-3 py-1.5 rounded-full bg-beige-dark text-white text-sm font-medium shadow-sm hover:bg-brown transition-colors flex items-center gap-1"
          >
            <FiPlusCircle /> 追加
          </button>
        )}
      </div>

      <p className="text-xs text-warm-gray leading-relaxed">
        毎月決まった日の支出（家賃・光熱費など）を登録すると、その日になったら自動で支出として記録されます。
      </p>

      {/* 追加フォーム */}
      {showForm && (
        <div className="bg-white rounded-xl p-4 border border-beige shadow-sm">
          <h3 className="text-sm font-bold text-brown-dark mb-3">固定費を追加</h3>
          <RuleForm
            settings={settings}
            initial={EMPTY(settings)}
            submitLabel="登録する"
            onSubmit={handleAdd}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {/* 一覧 */}
      {rules.length === 0 && !showForm ? (
        <div className="text-center py-12 text-warm-gray">
          <p className="text-4xl mb-2">🔁</p>
          <p className="text-sm">固定費はまだありません</p>
          <p className="text-xs mt-1">「追加」から毎月の固定費を登録しましょう</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rules.map((rule) =>
            editingId === rule.id ? (
              <div key={rule.id} className="bg-white rounded-xl p-4 border border-beige shadow-sm">
                <h3 className="text-sm font-bold text-brown-dark mb-3">固定費を編集</h3>
                <RuleForm
                  settings={settings}
                  initial={{ day: rule.day, payer: rule.payer, item: rule.item, amount: rule.amount, category: rule.category }}
                  submitLabel="保存する"
                  onSubmit={handleEditSave(rule.id)}
                  onCancel={() => setEditingId(null)}
                />
              </div>
            ) : (
              <div
                key={rule.id}
                className={`bg-white rounded-xl p-3 border shadow-sm flex items-center gap-3 ${
                  rule.active === false ? 'border-beige opacity-50' : 'border-beige'
                }`}
              >
                <div className="shrink-0 w-12 h-12 rounded-lg bg-cream-dark flex flex-col items-center justify-center leading-none">
                  <span className="text-[9px] text-warm-gray">毎月</span>
                  <span className="text-base font-bold text-brown-dark">{rule.day}</span>
                  <span className="text-[9px] text-warm-gray">日</span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-cream-dark text-brown font-medium">
                      {rule.payer}
                    </span>
                    {String(rule.payer).endsWith('のみ') && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-brown/10 text-brown font-medium">
                        個人
                      </span>
                    )}
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-cream text-warm-gray">
                      {rule.category}
                    </span>
                    {rule.active === false && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-warm-gray/20 text-warm-gray font-medium">
                        停止中
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-brown-dark truncate">{rule.item}</span>
                    <span className="text-base font-bold text-brown-dark ml-2 whitespace-nowrap">
                      ¥{formatCurrency(rule.amount)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-1 shrink-0">
                  <button
                    onClick={() => onEdit(rule.id, { active: !(rule.active !== false) })}
                    className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                      rule.active === false
                        ? 'bg-accent-green/15 text-accent-green hover:bg-accent-green/25'
                        : 'bg-cream text-warm-gray hover:bg-cream-dark'
                    }`}
                  >
                    {rule.active === false ? '再開' : '停止'}
                  </button>
                  <div className="flex gap-1">
                    <button
                      onClick={() => { setEditingId(rule.id); setShowForm(false); }}
                      className="p-1.5 rounded-lg text-warm-gray hover:bg-cream-dark hover:text-brown transition-colors"
                    >
                      <FiEdit2 className="text-sm" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`「${rule.item}」の固定費を削除しますか？\n（過去に自動生成された支出は残ります）`)) {
                          onDelete(rule.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-warm-gray hover:bg-danger/10 hover:text-danger transition-colors"
                    >
                      <FiTrash2 className="text-sm" />
                    </button>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
