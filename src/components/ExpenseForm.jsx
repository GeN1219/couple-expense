import { useState } from 'react';
import { FiPlusCircle } from 'react-icons/fi';

function todayString() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

export default function ExpenseForm({ settings, onAdd }) {
  const [form, setForm] = useState({
    date: todayString(),
    payer: settings.users[0] || '',
    item: '',
    amount: '',
    category: settings.categories[0] || '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const amount = parseInt(form.amount, 10);
    if (!form.item.trim() || !amount || amount <= 0) return;

    onAdd({
      date: form.date,
      payer: form.payer,
      item: form.item.trim(),
      amount,
      category: form.category,
    });

    setForm((prev) => ({ ...prev, item: '', amount: '' }));
  };

  const update = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h2 className="text-lg font-bold text-brown-dark mb-4">支出を追加</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-brown mb-1">日付</label>
          <input
            type="date"
            value={form.date}
            onChange={update('date')}
            className="w-full px-3 py-2.5 rounded-xl border border-beige bg-white text-brown-dark focus:outline-none focus:ring-2 focus:ring-beige-dark/50"
          />
        </div>

        {/* Payer */}
        <div>
          <label className="block text-sm font-medium text-brown mb-1">支払った人</label>
          <div className="flex gap-2">
            {settings.users.map((user) => (
              <button
                key={user}
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, payer: user }))}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  form.payer === user
                    ? 'bg-beige-dark text-white shadow-md'
                    : 'bg-cream border border-beige text-brown hover:bg-cream-dark'
                }`}
              >
                {user}
              </button>
            ))}
          </div>
        </div>

        {/* Item */}
        <div>
          <label className="block text-sm font-medium text-brown mb-1">項目名</label>
          <input
            type="text"
            value={form.item}
            onChange={update('item')}
            placeholder="例: スーパーで買い物"
            className="w-full px-3 py-2.5 rounded-xl border border-beige bg-white text-brown-dark placeholder-warm-gray focus:outline-none focus:ring-2 focus:ring-beige-dark/50"
          />
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-brown mb-1">金額</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray text-sm">¥</span>
            <input
              type="number"
              inputMode="numeric"
              value={form.amount}
              onChange={update('amount')}
              placeholder="0"
              min="1"
              className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-beige bg-white text-brown-dark placeholder-warm-gray focus:outline-none focus:ring-2 focus:ring-beige-dark/50"
            />
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-brown mb-1">カテゴリ</label>
          <div className="flex flex-wrap gap-2">
            {settings.categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, category: cat }))}
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

        {/* Submit */}
        <button
          type="submit"
          className="w-full py-3 rounded-xl bg-beige-dark text-white font-bold text-base shadow-md hover:bg-brown transition-colors duration-200 flex items-center justify-center gap-2"
        >
          <FiPlusCircle />
          追加する
        </button>
      </form>
    </div>
  );
}
