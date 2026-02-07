import { useMemo } from 'react';
import { formatCurrency, filterByPeriod, calcSettlement } from '../utils/calc';

export default function Home({ expenses, settings, onTabChange }) {
  const thisMonth = useMemo(() => filterByPeriod(expenses, 'this-month'), [expenses]);
  const settlement = useMemo(
    () => calcSettlement(expenses, settings.users),
    [expenses, settings.users]
  );

  const monthTotal = thisMonth.reduce((s, e) => s + e.amount, 0);
  const recent = expenses.slice(0, 5);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      {/* Welcome */}
      <div className="text-center py-2">
        <p className="text-base text-brown">
          {settings.users[0]} & {settings.users[1]}
        </p>
        <p className="text-xs text-warm-gray mt-0.5">の共有家計簿</p>
      </div>

      {/* Monthly summary */}
      <div className="bg-white rounded-xl p-5 border border-beige shadow-sm text-center">
        <p className="text-sm text-warm-gray mb-1">今月の支出</p>
        <p className="text-3xl font-bold text-brown-dark">¥{formatCurrency(monthTotal)}</p>
        <p className="text-xs text-warm-gray mt-1">{thisMonth.length}件</p>
      </div>

      {/* Settlement summary */}
      {settlement.unsettledCount > 0 && (
        <button
          onClick={() => onTabChange('settle')}
          className="w-full bg-accent-pink/10 rounded-xl p-4 border border-accent-pink/30 text-left hover:bg-accent-pink/15 transition-colors"
        >
          <p className="text-xs text-warm-gray mb-1">未精算</p>
          {settlement.transfers.length > 0 && settlement.transfers[0].amount > 0 ? (
            <p className="text-sm font-bold text-brown-dark">
              💸 {settlement.transfers[0].from} → {settlement.transfers[0].to} に ¥{formatCurrency(settlement.transfers[0].amount)}
            </p>
          ) : (
            <p className="text-sm font-bold text-brown-dark">
              ✨ 折半額は同じです
            </p>
          )}
          <p className="text-xs text-warm-gray mt-1">{settlement.unsettledCount}件の未精算があります →</p>
        </button>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => onTabChange('add')}
          className="bg-beige-dark text-white rounded-xl p-4 text-center shadow-md hover:bg-brown transition-colors"
        >
          <p className="text-2xl mb-1">➕</p>
          <p className="text-sm font-bold">支出を追加</p>
        </button>
        <button
          onClick={() => onTabChange('chart')}
          className="bg-white rounded-xl p-4 text-center border border-beige shadow-sm hover:bg-cream transition-colors"
        >
          <p className="text-2xl mb-1">📊</p>
          <p className="text-sm font-bold text-brown-dark">グラフを見る</p>
        </button>
      </div>

      {/* Recent expenses */}
      <div>
        <h3 className="text-sm font-bold text-brown-dark mb-2">最近の支出</h3>
        {recent.length === 0 ? (
          <div className="text-center py-8 text-warm-gray">
            <p className="text-3xl mb-2">🏠</p>
            <p className="text-sm">まだ支出がありません</p>
            <p className="text-xs mt-1">「追加」タブから記録を始めましょう</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recent.map((e) => (
              <div
                key={e.id}
                className={`bg-white rounded-xl px-3 py-2.5 border shadow-sm flex items-center justify-between ${
                  e.settled ? 'border-accent-green/30 opacity-60' : 'border-beige'
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-xs text-warm-gray">{e.date}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-cream-dark text-brown">
                      {e.payer}
                    </span>
                  </div>
                  <p className="text-sm text-brown-dark truncate">{e.item}</p>
                </div>
                <span className="text-base font-bold text-brown-dark ml-2 whitespace-nowrap">
                  ¥{formatCurrency(e.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
