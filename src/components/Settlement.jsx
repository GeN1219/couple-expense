import { useMemo } from 'react';
import { FiCheck, FiCheckCircle } from 'react-icons/fi';
import { calcSettlement, formatCurrency } from '../utils/calc';

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

export default function Settlement({ expenses, settings, onToggleSettle, onSettle }) {
  const result = useMemo(
    () => calcSettlement(expenses, settings.users),
    [expenses, settings.users]
  );

  // All expenses sorted: unsettled first, then settled
  const sortedExpenses = useMemo(() => {
    return [...expenses].sort((a, b) => {
      if (a.settled !== b.settled) return a.settled ? 1 : -1;
      return new Date(b.date) - new Date(a.date);
    });
  }, [expenses]);

  const handleBulkSettle = () => {
    if (result.unsettledIds.length === 0) return;
    if (window.confirm(`${result.unsettledCount}件の支出を精算済みにしますか？`)) {
      onSettle(result.unsettledIds);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <h2 className="text-lg font-bold text-brown-dark">精算</h2>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        {settings.users.map((user) => (
          <div key={user} className="bg-white rounded-xl p-4 border border-beige shadow-sm text-center">
            <p className="text-sm text-warm-gray mb-1">{user} の支払い</p>
            <p className="text-xl font-bold text-brown-dark">
              ¥{formatCurrency(result.totals[user] || 0)}
            </p>
          </div>
        ))}
      </div>

      {/* Total and per-person */}
      {result.unsettledCount > 0 && (
        <div className="bg-cream rounded-xl p-4 border border-beige">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-warm-gray">未精算の合計</span>
            <span className="font-bold text-brown-dark">¥{formatCurrency(result.totalAmount)}</span>
          </div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-warm-gray">1人あたり</span>
            <span className="font-bold text-brown-dark">¥{formatCurrency(result.perPerson)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-warm-gray">未精算件数</span>
            <span className="font-bold text-brown-dark">{result.unsettledCount}件</span>
          </div>
        </div>
      )}

      {/* Transfer instruction */}
      {result.unsettledCount > 0 && result.transfers.length > 0 && result.transfers[0].amount > 0 && (
        <div className="bg-accent-pink/10 rounded-xl p-5 border border-accent-pink/30 text-center">
          {result.transfers.map((t, i) => (
            <p key={i} className="text-base font-bold text-brown-dark">
              💸 {t.from} → {t.to} に{' '}
              <span className="text-xl text-danger">¥{formatCurrency(t.amount)}</span>{' '}
              支払い
            </p>
          ))}
        </div>
      )}

      {result.unsettledCount > 0 && result.transfers.length > 0 && result.transfers[0].amount === 0 && (
        <div className="bg-accent-green/10 rounded-xl p-5 border border-accent-green/30 text-center">
          <p className="text-base font-bold text-brown-dark">
            🎉 ぴったり折半！精算不要です
          </p>
        </div>
      )}

      {/* Bulk settle button */}
      {result.unsettledCount > 0 && (
        <button
          onClick={handleBulkSettle}
          className="w-full py-3 rounded-xl bg-accent-green text-white font-bold text-base shadow-md hover:bg-accent-green/80 transition-colors duration-200 flex items-center justify-center gap-2"
        >
          <FiCheckCircle />
          すべて精算する（{result.unsettledCount}件）
        </button>
      )}

      {result.unsettledCount === 0 && expenses.length > 0 && (
        <div className="text-center py-6 text-warm-gray">
          <p className="text-4xl mb-2">✨</p>
          <p>未精算の支出はありません</p>
        </div>
      )}

      {expenses.length === 0 && (
        <div className="text-center py-12 text-warm-gray">
          <p className="text-4xl mb-2">✨</p>
          <p>まだ支出がありません</p>
        </div>
      )}

      {/* Expense list with individual checkboxes */}
      {sortedExpenses.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-brown-dark mb-2">
            支出の精算状況
            <span className="font-normal text-warm-gray ml-2 text-xs">タップで個別に切り替え</span>
          </h3>
          <div className="space-y-2">
            {sortedExpenses.map((expense) => (
              <div
                key={expense.id}
                className={`bg-white rounded-xl px-3 py-2.5 border shadow-sm flex items-center gap-3 transition-all duration-200 ${
                  expense.settled ? 'border-accent-green/30 opacity-60' : 'border-beige'
                }`}
              >
                <SettleCheckbox
                  checked={expense.settled}
                  onChange={() => onToggleSettle(expense.id)}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-xs text-warm-gray">{expense.date}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-cream-dark text-brown font-medium">
                      {expense.payer}
                    </span>
                    {expense.payer.endsWith('のみ') && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-brown/10 text-brown font-medium">
                        個人
                      </span>
                    )}
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-cream text-warm-gray">
                      {expense.category}
                    </span>
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
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
