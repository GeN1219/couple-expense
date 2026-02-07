export function calcSettlement(expenses, users) {
  const unsettled = expenses.filter((e) => !e.settled);

  const totals = {};
  for (const user of users) {
    totals[user] = 0;
  }

  for (const expense of unsettled) {
    if (totals[expense.payer] !== undefined) {
      totals[expense.payer] += expense.amount;
    }
  }

  const totalAmount = Object.values(totals).reduce((a, b) => a + b, 0);
  const perPerson = Math.floor(totalAmount / users.length);

  const balances = {};
  for (const user of users) {
    balances[user] = totals[user] - perPerson;
  }

  // Determine who pays whom
  const result = {
    totals,
    totalAmount,
    perPerson,
    unsettledCount: unsettled.length,
    unsettledIds: unsettled.map((e) => e.id),
    transfers: [],
  };

  if (users.length === 2) {
    const [userA, userB] = users;
    const diff = balances[userA] - balances[userB];
    if (diff > 0) {
      result.transfers.push({
        from: userB,
        to: userA,
        amount: Math.floor(Math.abs(diff) / 2),
      });
    } else if (diff < 0) {
      result.transfers.push({
        from: userA,
        to: userB,
        amount: Math.floor(Math.abs(diff) / 2),
      });
    }
  }

  return result;
}

export function getMonthlyData(expenses) {
  const monthMap = {};
  const categories = new Set();

  for (const expense of expenses) {
    const month = expense.date.slice(0, 7); // YYYY-MM
    categories.add(expense.category);
    if (!monthMap[month]) {
      monthMap[month] = { month, total: 0 };
    }
    monthMap[month].total += expense.amount;
    monthMap[month][expense.category] = (monthMap[month][expense.category] || 0) + expense.amount;
  }

  const data = Object.values(monthMap).sort((a, b) => a.month.localeCompare(b.month));
  return { data, categories: [...categories] };
}

export function getCategoryData(expenses) {
  const catMap = {};

  for (const expense of expenses) {
    if (!catMap[expense.category]) {
      catMap[expense.category] = 0;
    }
    catMap[expense.category] += expense.amount;
  }

  return Object.entries(catMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export function getPayerData(expenses, users) {
  const payerMap = {};
  for (const user of users) {
    payerMap[user] = 0;
  }

  for (const expense of expenses) {
    if (payerMap[expense.payer] !== undefined) {
      payerMap[expense.payer] += expense.amount;
    }
  }

  return Object.entries(payerMap).map(([name, value]) => ({ name, value }));
}

export function filterByPeriod(expenses, period) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  switch (period) {
    case 'this-month': {
      const start = new Date(year, month, 1).toISOString().slice(0, 10);
      const end = new Date(year, month + 1, 0).toISOString().slice(0, 10);
      return expenses.filter((e) => e.date >= start && e.date <= end);
    }
    case 'last-month': {
      const start = new Date(year, month - 1, 1).toISOString().slice(0, 10);
      const end = new Date(year, month, 0).toISOString().slice(0, 10);
      return expenses.filter((e) => e.date >= start && e.date <= end);
    }
    case 'last-3-months': {
      const start = new Date(year, month - 2, 1).toISOString().slice(0, 10);
      return expenses.filter((e) => e.date >= start);
    }
    case 'all':
    default:
      return expenses;
  }
}

export function formatCurrency(amount) {
  return amount.toLocaleString('ja-JP');
}
