import { useState, useMemo, useCallback } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line,
} from 'recharts';
import { FiCheck, FiChevronRight } from 'react-icons/fi';
import { getCategoryData, getPayerData, getMonthlyData, filterByPeriod, formatCurrency } from '../utils/calc';

const COLORS = ['#D4B896', '#E8A0BF', '#A8C5A0', '#A0BFE0', '#E8C5A0', '#C5A0E0', '#C4A67A', '#8B7355'];

const LINE_COLORS = [
  '#C4A67A', '#D4866A', '#A8C5A0', '#A0BFE0', '#E8A0BF',
  '#C5A0E0', '#E8C5A0', '#8B7355', '#B5838D', '#6B8E6B',
];

const TOTAL_LINE_COLOR = '#6B5740';

const PERIODS = [
  { value: 'this-month', label: '今月' },
  { value: 'last-month', label: '先月' },
  { value: 'last-3-months', label: '直近3ヶ月' },
  { value: 'all', label: '全期間' },
];

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-beige rounded-lg px-3 py-2 shadow-md text-sm">
      <p className="text-brown-dark font-medium">{payload[0].name || payload[0].payload?.name}</p>
      <p className="text-brown">¥{formatCurrency(payload[0].value)}</p>
    </div>
  );
}

function MultiLineTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-beige rounded-lg px-3 py-2 shadow-md text-sm max-w-48">
      <p className="text-brown-dark font-bold mb-1">{label}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex justify-between gap-3 text-xs">
          <span className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
            {entry.dataKey === 'total' ? '全合計' : entry.dataKey}
          </span>
          <span className="font-medium">¥{formatCurrency(entry.value || 0)}</span>
        </div>
      ))}
    </div>
  );
}

function CategoryCheckbox({ label, color, checked, onChange }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className="flex items-center gap-1.5 shrink-0"
    >
      <span
        className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all duration-200 ${
          checked ? 'text-white' : 'bg-cream'
        }`}
        style={{
          backgroundColor: checked ? color : undefined,
          borderColor: checked ? color : '#D4B896',
        }}
      >
        {checked && <FiCheck className="text-[10px]" strokeWidth={3} />}
      </span>
      <span className="text-xs text-brown whitespace-nowrap">{label}</span>
    </button>
  );
}

export default function Charts({ expenses, settings }) {
  const [period, setPeriod] = useState('all');

  const filtered = useMemo(() => filterByPeriod(expenses, period), [expenses, period]);
  const categoryData = useMemo(() => getCategoryData(filtered), [filtered]);
  const payerData = useMemo(() => getPayerData(filtered, settings.users), [filtered, settings.users]);
  const monthly = useMemo(() => getMonthlyData(expenses), [expenses]);

  const totalAmount = filtered.reduce((s, e) => s + e.amount, 0);

  // カテゴリ明細のタップ展開
  const [expandedCats, setExpandedCats] = useState(() => new Set());
  const toggleExpanded = useCallback((cat) => {
    setExpandedCats((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return next;
    });
  }, []);

  // カテゴリ→その期間の個別支出（日付降順）
  const expensesByCategory = useMemo(() => {
    const map = {};
    for (const e of filtered) {
      (map[e.category] ||= []).push(e);
    }
    for (const k of Object.keys(map)) {
      map[k].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
    }
    return map;
  }, [filtered]);

  // Category visibility for monthly chart
  const [visibleCategories, setVisibleCategories] = useState(null);

  // Build the set of visible keys (lazy init from monthly.categories)
  const allCategories = monthly.categories;
  const visible = useMemo(() => {
    if (visibleCategories !== null) return visibleCategories;
    const init = new Set(allCategories);
    init.add('total');
    return init;
  }, [visibleCategories, allCategories]);

  const allCategoriesChecked = allCategories.every((c) => visible.has(c));
  const isAllChecked = allCategoriesChecked && visible.has('total');

  const toggleCategory = useCallback((cat) => {
    setVisibleCategories((prev) => {
      const next = new Set(prev ?? [...allCategories, 'total']);
      if (next.has(cat)) {
        next.delete(cat);
      } else {
        next.add(cat);
      }
      return next;
    });
  }, [allCategories]);

  const toggleAll = useCallback(() => {
    setVisibleCategories(() => {
      if (isAllChecked) {
        return new Set();
      }
      const next = new Set(allCategories);
      next.add('total');
      return next;
    });
  }, [isAllChecked, allCategories]);

  // Color map for categories
  const categoryColorMap = useMemo(() => {
    const map = {};
    allCategories.forEach((cat, i) => {
      map[cat] = LINE_COLORS[i % LINE_COLORS.length];
    });
    return map;
  }, [allCategories]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <h2 className="text-lg font-bold text-brown-dark">グラフ</h2>

      {/* Period filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${
              period === p.value
                ? 'bg-beige-dark text-white shadow-sm'
                : 'bg-cream border border-beige text-brown hover:bg-cream-dark'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-warm-gray">
          <p className="text-4xl mb-2">📊</p>
          <p>この期間のデータはありません</p>
        </div>
      ) : (
        <>
          {/* Total */}
          <div className="bg-white rounded-xl p-4 border border-beige shadow-sm text-center">
            <p className="text-sm text-warm-gray mb-1">合計支出</p>
            <p className="text-2xl font-bold text-brown-dark">¥{formatCurrency(totalAmount)}</p>
            <p className="text-xs text-warm-gray mt-1">{filtered.length}件</p>
          </div>

          {/* Category pie chart */}
          <div className="bg-white rounded-xl p-4 border border-beige shadow-sm">
            <h3 className="text-sm font-bold text-brown-dark mb-3">カテゴリ別</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  formatter={(value) => <span className="text-xs text-brown">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Category breakdown table (tap to expand details) */}
          <div className="bg-white rounded-xl p-4 border border-beige shadow-sm">
            <h3 className="text-sm font-bold text-brown-dark mb-3">カテゴリ別 明細</h3>
            <div className="divide-y divide-beige/50">
              {categoryData.map((cat, i) => {
                const isOpen = expandedCats.has(cat.name);
                const pct = totalAmount > 0 ? Math.round((cat.value / totalAmount) * 100) : 0;
                const color = COLORS[i % COLORS.length];
                return (
                  <div key={cat.name}>
                    <button
                      type="button"
                      onClick={() => toggleExpanded(cat.name)}
                      className="w-full flex items-center gap-2 py-2.5 text-left hover:bg-cream/40 transition-colors -mx-1 px-1 rounded-lg"
                    >
                      <FiChevronRight
                        className={`text-warm-gray text-sm shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
                      />
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                      <span className="text-sm text-brown-dark flex-1 min-w-0 truncate">{cat.name}</span>
                      <span className="text-xs text-warm-gray shrink-0">{cat.count}件</span>
                      <span className="text-xs text-warm-gray shrink-0 w-9 text-right">{pct}%</span>
                      <span className="text-sm font-bold text-brown-dark shrink-0 w-20 text-right">
                        ¥{formatCurrency(cat.value)}
                      </span>
                    </button>

                    {isOpen && (
                      <div className="pb-2 pl-6 pr-1 space-y-1">
                        {(expensesByCategory[cat.name] || []).map((e) => (
                          <div
                            key={e.id}
                            className="flex items-center gap-2 text-xs bg-cream/50 rounded-lg px-2.5 py-1.5"
                          >
                            <span className="text-warm-gray shrink-0">{e.date}</span>
                            <span className="px-1.5 py-0.5 rounded-full bg-cream-dark text-brown shrink-0">
                              {e.payer}
                            </span>
                            <span className="text-brown-dark flex-1 min-w-0 truncate">{e.item}</span>
                            <span className="font-bold text-brown-dark shrink-0 whitespace-nowrap">
                              ¥{formatCurrency(e.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payer bar chart */}
          <div className="bg-white rounded-xl p-4 border border-beige shadow-sm">
            <h3 className="text-sm font-bold text-brown-dark mb-3">支払者別</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={payerData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E8D7C3" />
                <XAxis type="number" tickFormatter={(v) => `¥${formatCurrency(v)}`} tick={{ fontSize: 10, fill: '#8B7355' }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#6B5740' }} width={60} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                  {payerData.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? '#E8A0BF' : '#A0BFE0'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Monthly trend line chart (category breakdown) */}
          {monthly.data.length > 1 && (
            <div className="bg-white rounded-xl p-4 border border-beige shadow-sm">
              <h3 className="text-sm font-bold text-brown-dark mb-3">月別推移</h3>

              {/* Category filter checkboxes */}
              <div className="flex flex-wrap gap-x-3 gap-y-2 mb-4 pb-3 border-b border-beige/50">
                <CategoryCheckbox
                  label="全合計"
                  color={TOTAL_LINE_COLOR}
                  checked={isAllChecked}
                  onChange={toggleAll}
                />
                {allCategories.map((cat) => (
                  <CategoryCheckbox
                    key={cat}
                    label={cat}
                    color={categoryColorMap[cat]}
                    checked={visible.has(cat)}
                    onChange={() => toggleCategory(cat)}
                  />
                ))}
              </div>

              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={monthly.data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8D7C3" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#8B7355' }} />
                  <YAxis tickFormatter={(v) => `¥${formatCurrency(v)}`} tick={{ fontSize: 10, fill: '#8B7355' }} width={50} />
                  <Tooltip content={<MultiLineTooltip />} />

                  {/* Total line */}
                  {visible.has('total') && (
                    <Line
                      type="monotone"
                      dataKey="total"
                      name="全合計"
                      stroke={TOTAL_LINE_COLOR}
                      strokeWidth={3}
                      dot={{ fill: TOTAL_LINE_COLOR, r: 4 }}
                      activeDot={{ r: 6, fill: TOTAL_LINE_COLOR }}
                    />
                  )}

                  {/* Category lines */}
                  {allCategories.map((cat) =>
                    visible.has(cat) ? (
                      <Line
                        key={cat}
                        type="monotone"
                        dataKey={cat}
                        name={cat}
                        stroke={categoryColorMap[cat]}
                        strokeWidth={2}
                        dot={{ fill: categoryColorMap[cat], r: 3 }}
                        activeDot={{ r: 5, fill: categoryColorMap[cat] }}
                        connectNulls
                      />
                    ) : null
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  );
}
