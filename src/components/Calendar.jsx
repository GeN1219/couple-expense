import { useState, useMemo } from 'react';
import { FiChevronLeft, FiChevronRight, FiX } from 'react-icons/fi';
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

export default function Calendar({ expenses, settings }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);

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
  };

  const nextMonth = () => {
    if (month === 11) { setYear(year + 1); setMonth(0); }
    else setMonth(month + 1);
    setSelectedDate(null);
  };

  const goToday = () => {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
    setSelectedDate(null);
  };

  // Build calendar grid cells
  const cells = [];
  // Empty cells before first day
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
              onClick={() => setSelectedDate(isSelected ? null : dateStr)}
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

      {/* Selected date detail modal */}
      {selectedDate && (
        <div className="mt-4 bg-white rounded-xl border border-beige shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-cream-dark/50 border-b border-beige/50">
            <h3 className="text-sm font-bold text-brown-dark">
              {selectedDate.replace(/-/g, '/')} の支出
            </h3>
            <button
              onClick={() => setSelectedDate(null)}
              className="p-1 rounded-lg hover:bg-cream transition-colors text-warm-gray"
            >
              <FiX className="text-sm" />
            </button>
          </div>
          {selectedData && selectedData.items.length > 0 ? (
            <div className="divide-y divide-beige/30">
              {selectedData.items.map((exp) => (
                <div key={exp.id} className="px-4 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-cream-dark text-brown font-medium">
                        {exp.payer}
                      </span>
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
            <div className="text-center py-8 text-warm-gray">
              <p className="text-2xl mb-1">📭</p>
              <p className="text-sm">この日の支出はありません</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
