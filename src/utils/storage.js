const STORAGE_KEYS = {
  SETTINGS: 'couple-expense-settings',
  EXPENSES: 'couple-expense-expenses',
  RECURRING: 'couple-expense-recurring',
};

const DEFAULT_SETTINGS = {
  users: ['パートナー1', 'パートナー2'],
  categories: ['食費', '日用品', '旅行', '娯楽', '交通費', '外食', '光熱費', 'その他'],
};

export function getSettings() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (data) {
      const parsed = JSON.parse(data);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
    return { ...DEFAULT_SETTINGS };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings) {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
}

export function getExpenses() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveExpenses(expenses) {
  localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
}

export function addExpense(expense) {
  const expenses = getExpenses();
  const newExpense = {
    ...expense,
    id: crypto.randomUUID(),
    settled: false,
    createdAt: new Date().toISOString(),
  };
  expenses.unshift(newExpense);
  saveExpenses(expenses);
  return newExpense;
}

export function updateExpense(id, updates) {
  const expenses = getExpenses();
  const index = expenses.findIndex((e) => e.id === id);
  if (index !== -1) {
    expenses[index] = { ...expenses[index], ...updates };
    saveExpenses(expenses);
    return expenses[index];
  }
  return null;
}

export function deleteExpense(id) {
  const expenses = getExpenses().filter((e) => e.id !== id);
  saveExpenses(expenses);
}

export function toggleSettleExpense(id) {
  const expenses = getExpenses();
  const expense = expenses.find((e) => e.id === id);
  if (expense) {
    expense.settled = !expense.settled;
    expense.settledAt = expense.settled ? new Date().toISOString() : null;
  }
  saveExpenses(expenses);
}

export function settleExpenses(ids) {
  const expenses = getExpenses();
  for (const expense of expenses) {
    if (ids.includes(expense.id)) {
      expense.settled = true;
      expense.settledAt = new Date().toISOString();
    }
  }
  saveExpenses(expenses);
}

// ===== 固定費（定期支出ルール） =====

export function getRecurring() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.RECURRING);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveRecurring(rules) {
  localStorage.setItem(STORAGE_KEYS.RECURRING, JSON.stringify(rules));
}

export function addRecurring(rule) {
  const rules = getRecurring();
  const newRule = {
    ...rule,
    id: crypto.randomUUID(),
    active: rule.active ?? true,
    createdAt: new Date().toISOString(),
  };
  rules.push(newRule);
  saveRecurring(rules);
  return newRule;
}

export function updateRecurring(id, updates) {
  const rules = getRecurring();
  const index = rules.findIndex((r) => r.id === id);
  if (index !== -1) {
    rules[index] = { ...rules[index], ...updates };
    saveRecurring(rules);
    return rules[index];
  }
  return null;
}

export function deleteRecurring(id) {
  saveRecurring(getRecurring().filter((r) => r.id !== id));
}
