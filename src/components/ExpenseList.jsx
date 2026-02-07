import { useState } from 'react';
import { FiEdit2, FiTrash2, FiCheck, FiX } from 'react-icons/fi';
import { formatCurrency } from '../utils/calc';

function SettleCheckbox({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all duration-200 ${
        checked
          ? 'bg-accent-green border-accent-green text-white'
          : 'border-beige-dark/40 bg-cream hover:border-beige-dark'
      }`}
    >
      {checked && <FiCheck className="text-xs" strokeWidth={3} />}
    </button>
  );
}

export default function ExpenseList({ expenses, settings, onEdit, onDelete, onToggleSettle }) {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showSettled, setShowSettled] = useState(false);

  const filtered = showSettled ? expenses : expenses.filter((e) => !e.settled);

  const startEdit = (expense) => {
    setEditingId(expense.id);
    setEditForm({
      date: expense.date,
      payer: expense.payer,
      item: expense.item,
      amount: expense.amount,
      category: expense.category,
    });
  };

  const saveEdit = () => {
    if (!editForm.item.trim() || !editForm.amount || editForm.amount <= 0) return;
    onEdit(editingId, { ...editForm, amount: parseInt(editForm.amount, 10) });
    setEditingId(null);
  };

  const cancelEdit = () => setEditingId(null);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-brown-dark">支出一覧</h2>
        <label className="flex items-center gap-1.5 text-sm text-warm-gray cursor-pointer">
          <input
            type="checkbox"
            checked={showSettled}
            onChange={(e) => setShowSettled(e.target.checked)}
            className="rounded accent-beige-dark"
          />
          精算済みも表示
        </label>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-warm-gray">
          <p className="text-4xl mb-2">📝</p>
          <p>まだ支出がありません</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((expense) =>
            editingId === expense.id ? (
              <div
                key={expense.id}
                className="bg-white rounded-xl p-3 border border-beige shadow-sm space-y-2"
              >
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={editForm.date}
                    onChange={(e) => setEditForm((p) => ({ ...p, date: e.target.value }))}
                    className="flex-1 px-2 py-1.5 rounded-lg border border-beige text-sm"
                  />
                  <select
                    value={editForm.payer}
                    onChange={(e) => setEditForm((p) => ({ ...p, payer: e.target.value }))}
                    className="px-2 py-1.5 rounded-lg border border-beige text-sm bg-white"
                  >
                    {settings.users.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editForm.item}
                    onChange={(e) => setEditForm((p) => ({ ...p, item: e.target.value }))}
                    className="flex-1 px-2 py-1.5 rounded-lg border border-beige text-sm"
                  />
                  <input
                    type="number"
                    value={editForm.amount}
                    onChange={(e) => setEditForm((p) => ({ ...p, amount: e.target.value }))}
                    className="w-24 px-2 py-1.5 rounded-lg border border-beige text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm((p) => ({ ...p, category: e.target.value }))}
                    className="flex-1 px-2 py-1.5 rounded-lg border border-beige text-sm bg-white"
                  >
                    {settings.categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <button
                    onClick={saveEdit}
                    className="px-3 py-1.5 bg-accent-green text-white rounded-lg text-sm flex items-center gap-1"
                  >
                    <FiCheck /> 保存
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="px-3 py-1.5 bg-warm-gray text-white rounded-lg text-sm flex items-center gap-1"
                  >
                    <FiX /> 取消
                  </button>
                </div>
              </div>
            ) : (
              <div
                key={expense.id}
                className={`bg-white rounded-xl p-3 border shadow-sm flex items-center gap-3 transition-all duration-200 ${
                  expense.settled ? 'border-accent-green/30 opacity-60' : 'border-beige'
                }`}
              >
                {/* Individual settle checkbox */}
                <SettleCheckbox
                  checked={expense.settled}
                  onChange={() => onToggleSettle(expense.id)}
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs text-warm-gray">{expense.date}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-cream-dark text-brown font-medium">
                      {expense.payer}
                    </span>
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-cream text-warm-gray">
                      {expense.category}
                    </span>
                    {expense.settled && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-accent-green/20 text-accent-green font-medium">
                        精算済
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className={`text-sm truncate ${expense.settled ? 'line-through text-warm-gray' : 'text-brown-dark'}`}>
                      {expense.item}
                    </span>
                    <span className={`text-base font-bold ml-2 whitespace-nowrap ${expense.settled ? 'text-warm-gray' : 'text-brown-dark'}`}>
                      ¥{formatCurrency(expense.amount)}
                    </span>
                  </div>
                </div>

                {!expense.settled && (
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => startEdit(expense)}
                      className="p-2 rounded-lg text-warm-gray hover:bg-cream-dark hover:text-brown transition-colors"
                    >
                      <FiEdit2 className="text-sm" />
                    </button>
                    <button
                      onClick={() => onDelete(expense.id)}
                      className="p-2 rounded-lg text-warm-gray hover:bg-danger/10 hover:text-danger transition-colors"
                    >
                      <FiTrash2 className="text-sm" />
                    </button>
                  </div>
                )}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
