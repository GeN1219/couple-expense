import { useState, useMemo } from 'react';
import { FiChevronLeft, FiChevronRight, FiX, FiPlusCircle, FiEdit2, FiTrash2, FiCheck } from 'react-icons/fi';
import { formatCurrency } from '../utils/calc';

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year, month) {
  return new Date(year, month, 1).getDay();
}

function toDateStr(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function DayExpenseForm({ date, settings, initialValues, mode, onSubmit, onCancel }) {
  const [form, setForm] = useState(
    initialValues || {
      payer: settings.users[0] || '',
      item: '',
      amount: '',
      category: settings.categories[0] || '',
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    const amount = parseInt(form.amount, 10);
    if (!form.item.trim() || !amount || amount <= 0) return;
    onSubmit({ ...form, item: form.item.trim(), amount });
  };

  return (
    <form onSubmit={handleSubmit} className="px-4 py-3 bg-cream/50 border-b border-beige/50 space-y-2.5">
      {/* Payer */}
      <div>
        <p className="text-xs text-warm-gray mb-1">支払った人</p>
        <div className="flex gap-1.5 mb-1.5">
          {settings.users.map((user) => (
            <button
              key={user}
              type="button"
              onClick={() => setForm((p) => ({ ...p, payer: user }))}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                form.payer === user
                  ? 'bg-beige-dark text-white shadow-sm'
                  : 'bg-white border border-beige text-brown hover:bg-cream'
              }`}
            >
              {user}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5">
          {settings.users.map((user) => (
            <button
              key={`${user}のみ`}
              type="button"
              onClick={() => setForm((p) => ({ ...p, payer: `${user}のみ` }))}
              className={`flex-1 py-1 rounded-lg text-xs font-medium transition-all ${
                form.payer === `${user}のみ`
                  ? 'bg-brown text-white shadow-sm'
                  : 'bg-white border border-beige-dark/40 text-brown/60 hover:bg-cream'
              }`}
            >
              {user}のみ
            </button>
          ))}
        </div>
      </div>

      {/* Item + Amount */}
      <div className="flex gap-2">
        <input
          type="text"
          value={form.item}
          onChange={(e) => setForm((p) => ({ ...p, item: e.target.value }))}
          placeholder="項目名"
          className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg border border-beige text-sm bg-white text-brown-dark placeholder-warm-gray/60 focus:outline-none focus:ring-1 focus:ring-beige-dark/50"
        />
        <div className="relative shrink-0 w-24">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-warm-gray text-xs">¥</span>
          <input
            type="number"
            inputMode="numeric"
            value={form.amount}
            onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
            placeholder="0"
            min="1"
            className="w-full pl-6 pr-2 py-1.5 rounded-lg border border-beige text-sm bg-white text-brown-dark placeholder-warm-gray/60 focus:outline-none focus:ring-1 focus:ring-beige-dark/50"
          />
        </div>
      </div>

      {/* Category */}
      <div className="flex flex-wrap gap-1.5">
        {settings.categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setForm((p) => ({ ...p, category: cat }))}
            className={`px-2.5 py-1 rounded-full text-xs transition-all ${
              form.category === cat
                ? 'bg-beige-dark text-white shadow-sm'
                : 'bg-white border border-beige text-brown hover:bg-cream'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-0.5">
        <button
          type="submit"
          className="flex-1 py-1.5 rounded-lg bg-beige-dark text-white text-xs font-bold flex items-center justify-center gap-1 hover:bg-brown transition-colors"
        >
          <FiCheck />
          {mode === 'add' ? '追加する' : '保存する'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 rounded-lg bg-cream border border-beige text-warm-gray text-xs hover:bg-cream-dark transition-colors"
        >
          キャンセル
        </button>
      </div>
    </form>
  );
}

export default function Calendar({ expenses, settings, onAdd, onEdit, onDelete }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);
  const [formMode, setFormMode] = useState(null); // null | 'add' | 'edit'
  const [editingExpense, setEditingExpense] = useState(null);

  // Build a map: dateStr -> { total, items }
  const dateMap = useMemo(() => {
    const map = {};
    for (const exp of expenses) {
      if (!map[exp.date]) {
        map[exp.date] = { total: 0, items: [] };
      }
      map[exp.date].total += exp.amount;
      map[exp.date].items.push(exp);
    }
    return map;
  }, [expenses]);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);

  const prevMonth = () => {
    if (month === 0) { setYear(year - 1); setMonth(11); }
    else setMonth(month - 1);
    setSelectedDate(null);
    setFormMode(null);
  };

  const nextMonth = () => {
    if (month === 11) { setYear(year + 1); setMonth(0); }
    else setMonth(month + 1);
    setSelectedDate(null);
    setFormMode(null);
  };

  const goToday = () => {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
    setSelectedDate(null);
    setFormMode(null);
  };

  const selectDate = (dateStr, isSelected) => {
    setSelectedDate(isSelected ? null : dateStr);
    setFormMode(null);
    setEditingExpense(null);
  };

  const closePanel = () => {
    setSelectedDate(null);
    setFormMode(null);
    setEditingExpense(null);
  };

  const openAddForm = () => {
    setEditingExpense(null);
    setFormMode('add');
  };

  const openEditForm = (exp) => {
    setEditingExpense(exp);
    setFormMode('edit');
  };

  const cancelForm = () => {
    setFormMode(null);
    setEditingExpense(null);
  };

  const handleAdd = (fields) => {
    onAdd({ date: selectedDate, ...fields });
    setFormMode(null);
  };

  const handleEdit = (fields) => {
    onEdit(editingExpense.id, fields);
    setFormMode(null);
    setEditingExpense(null);
  };

  const handleDelete = (id) => {
    if (window.confirm('この支出を削除しますか？')) {
      onDelete(id);
    }
  };

  // Build calendar grid cells
  const cells = [];
  for (let i = 0; i < firstDay; i++) {
    cells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(d);
  }

  const selectedData = selectedDate ? dateMap[selectedDate] : null;
  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());

  // Monthly total
  const monthlyTotal = useMemo(() => {
    const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
    return expenses
      .filter((e) => e.date.startsWith(prefix))
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses, year, month]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header: month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="p-2 rounded-lg hover:bg-cream-dark transition-colors text-brown"
        >
          <FiChevronLeft className="text-xl" />
        </button>
        <div className="text-center">
          <button onClick={goToday} className="hover:opacity-70 transition-opacity">
            <h2 className="text-lg font-bold text-brown-dark">
              {year}年{month + 1}月
            </h2>
          </button>
          <p className="text-xs text-warm-gray mt-0.5">
            合計 <span className="font-bold text-brown">¥{formatCurrency(monthlyTotal)}</span>
          </p>
        </div>
        <button
          onClick={nextMonth}
          className="p-2 rounded-lg hover:bg-cream-dark transition-colors text-brown"
        >
          <FiChevronRight className="text-xl" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((wd, i) => (
          <div
            key={wd}
            className={`text-center text-xs font-bold py-1.5 ${
              i === 0 ? 'text-danger' : i === 6 ? 'text-accent-blue' : 'text-warm-gray'
            }`}
          >
            {wd}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px bg-beige/30 rounded-xl overflow-hidden border border-beige/50">
        {cells.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} className="bg-warm-white min-h-[3.5rem]" />;
          }
          const dateStr = toDateStr(year, month, day);
          const data = dateMap[dateStr];
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedDate;
          const dayOfWeek = (firstDay + day - 1) % 7;

          return (
            <button
              key={day}
              onClick={() => selectDate(dateStr, isSelected)}
              className={`min-h-[3.5rem] p-1 flex flex-col items-center justify-start transition-colors ${
                isSelected
                  ? 'bg-beige-dark/30'
                  : 'bg-warm-white hover:bg-cream'
              }`}
            >
              <span
                className={`text-xs w-6 h-6 flex items-center justify-center rounded-full ${
                  isToday
                    ? 'bg-brown-dark text-white font-bold'
                    : dayOfWeek === 0
                    ? 'text-danger'
                    : dayOfWeek === 6
                    ? 'text-accent-blue'
                    : 'text-brown-dark'
                }`}
              >
                {day}
              </span>
              {data && (
                <span className="text-[10px] font-bold text-brown mt-0.5 leading-tight">
                  ¥{data.total >= 10000
                    ? `${Math.floor(data.total / 1000)}k`
                    : formatCurrency(data.total)}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected date detail panel */}
      {selectedDate && (
        <div className="mt-4 bg-white rounded-xl border border-beige shadow-sm overflow-hidden">
          {/* Panel header */}
          <div className="flex items-center justify-between px-4 py-3 bg-cream-dark/50 border-b border-beige/50">
            <h3 className="text-sm font-bold text-brown-dark">
              {selectedDate.replace(/-/g, '/')} の支出
            </h3>
            <div className="flex items-center gap-1">
              {onAdd && formMode === null && (
                <button
                  onClick={openAddForm}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-beige-dark text-white text-xs font-medium hover:bg-brown transition-colors"
                >
                  <FiPlusCircle className="text-sm" />
                  追加
                </button>
              )}
              <button
                onClick={closePanel}
                className="p-1 rounded-lg hover:bg-cream transition-colors text-warm-gray ml-1"
              >
                <FiX className="text-sm" />
              </button>
            </div>
          </div>

          {/* Add form */}
          {formMode === 'add' && (
            <DayExpenseForm
              date={selectedDate}
              settings={settings}
              mode="add"
              onSubmit={handleAdd}
              onCancel={cancelForm}
            />
          )}

          {/* Expense list */}
          {selectedData && selectedData.items.length > 0 ? (
            <div className="divide-y divide-beige/30">
              {selectedData.items.map((exp) => (
                <div key={exp.id}>
                  {/* Edit form for this item */}
                  {formMode === 'edit' && editingExpense?.id === exp.id ? (
                    <DayExpenseForm
                      date={selectedDate}
                      settings={settings}
                      mode="edit"
                      initialValues={{
                        payer: exp.payer,
                        item: exp.item,
                        amount: String(exp.amount),
                        category: exp.category,
                      }}
                      onSubmit={handleEdit}
                      onCancel={cancelForm}
                    />
                  ) : (
                    <div className="px-4 py-3 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-cream-dark text-brown font-medium">
                            {exp.payer}
                          </span>
                          {exp.payer.endsWith('のみ') && (
                            <span className="text-xs px-1.5 py-0.5 rounded-full bg-brown/10 text-brown font-medium">
                              個人
                            </span>
                          )}
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-cream text-warm-gray">
                            {exp.category}
                          </span>
                          {exp.settled && (
                            <span className="text-xs px-1.5 py-0.5 rounded-full bg-accent-green/20 text-accent-green font-medium">
                              精算済
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-brown-dark truncate block">{exp.item}</span>
                      </div>
                      <span className="text-sm font-bold text-brown-dark whitespace-nowrap">
                        ¥{formatCurrency(exp.amount)}
                      </span>
                      {!exp.settled && onEdit && onDelete && formMode === null && (
                        <div className="flex gap-1 shrink-0">
                          <button
                            onClick={() => openEditForm(exp)}
                            className="p-1.5 rounded-lg text-warm-gray hover:bg-cream-dark hover:text-brown transition-colors"
                          >
                            <FiEdit2 className="text-xs" />
                          </button>
                          <button
                            onClick={() => handleDelete(exp.id)}
                            className="p-1.5 rounded-lg text-warm-gray hover:bg-danger/10 hover:text-danger transition-colors"
                          >
                            <FiTrash2 className="text-xs" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              <div className="px-4 py-2.5 bg-cream/50 flex justify-between items-center">
                <span className="text-xs text-warm-gray">{selectedData.items.length}件</span>
                <span className="text-sm font-bold text-brown-dark">
                  合計 ¥{formatCurrency(selectedData.total)}
                </span>
              </div>
            </div>
          ) : (
            formMode !== 'add' && (
              <div className="text-center py-8 text-warm-gray">
                <p className="text-2xl mb-1">📭</p>
                <p className="text-sm">この日の支出はありません</p>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
