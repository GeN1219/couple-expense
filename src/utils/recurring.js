import { toLocalDateStr } from './calc';

// 指定年月(month:0-11)の日数に day を丸める（例: 2月に31日指定→28/29日）
export function clampDay(year, month, day) {
  const lastDay = new Date(year, month + 1, 0).getDate();
  return Math.min(day, lastDay);
}

// 'YYYY-MM' を作る
export function toYm(year, month) {
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

// 今日を 'YYYY-MM' で
export function currentYm(now = new Date()) {
  return toYm(now.getFullYear(), now.getMonth());
}

/**
 * 固定費ルールから、まだ生成されていない支出を洗い出して返す純粋関数。
 * - active なルールのみ対象
 * - start_ym 〜 当月 の各月について、その月が過去 or (当月かつ day<=今日) なら生成対象
 * - 既存 expenses に同じ (recurring_id, recurring_month) があればスキップ（重複防止）
 *
 * 返す支出オブジェクト: { date, payer, item, amount, category, recurring_id, recurring_month }
 * （settled や id は挿入層で付与）
 */
export function materializeRecurring(rules, expenses, now = new Date()) {
  if (!rules || rules.length === 0) return [];

  // 既存の生成済みキー集合
  const existing = new Set();
  for (const e of expenses) {
    if (e.recurring_id && e.recurring_month) {
      existing.add(`${e.recurring_id}|${e.recurring_month}`);
    }
  }

  const curYear = now.getFullYear();
  const curMonth = now.getMonth(); // 0-11
  const curDate = now.getDate();

  const toInsert = [];

  for (const rule of rules) {
    if (rule.active === false) continue;
    if (!rule.start_ym) continue;

    const [syStr, smStr] = rule.start_ym.split('-');
    const startYear = parseInt(syStr, 10);
    const startMonth = parseInt(smStr, 10) - 1; // 0-11
    if (Number.isNaN(startYear) || Number.isNaN(startMonth)) continue;

    let y = startYear;
    let m = startMonth;

    // start_ym 〜 当月 をループ
    while (y < curYear || (y === curYear && m <= curMonth)) {
      const isCurrentMonth = y === curYear && m === curMonth;
      // その月に丸めた支払日（例: 31日→2月は末日28/29）
      const day = clampDay(y, m, rule.day);
      // 当月はまだ支払日が来ていなければ生成しない（丸め後の日で判定）
      if (!(isCurrentMonth && day > curDate)) {
        const ym = toYm(y, m);
        const key = `${rule.id}|${ym}`;
        if (!existing.has(key)) {
          toInsert.push({
            date: toLocalDateStr(new Date(y, m, day)),
            payer: rule.payer,
            item: rule.item,
            amount: rule.amount,
            category: rule.category,
            recurring_id: rule.id,
            recurring_month: ym,
          });
          existing.add(key); // 同一実行内の重複も防ぐ
        }
      }
      // 次の月へ
      m += 1;
      if (m > 11) { m = 0; y += 1; }
    }
  }

  return toInsert;
}
