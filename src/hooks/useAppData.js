import { useState, useCallback } from 'react';
import {
  getSettings,
  saveSettings,
  getExpenses,
  addExpense as addExpenseStorage,
  updateExpense as updateExpenseStorage,
  deleteExpense as deleteExpenseStorage,
  toggleSettleExpense as toggleSettleStorage,
  settleExpenses as settleExpensesStorage,
} from '../utils/storage';

export function useAppData() {
  const [settings, setSettingsState] = useState(getSettings);
  const [expenses, setExpensesState] = useState(getExpenses);

  const updateSettings = useCallback((newSettings) => {
    const merged = { ...settings, ...newSettings };
    saveSettings(merged);
    setSettingsState(merged);
  }, [settings]);

  const addExpense = useCallback((expense) => {
    const newExpense = addExpenseStorage(expense);
    setExpensesState((prev) => [newExpense, ...prev]);
    return newExpense;
  }, []);

  const editExpense = useCallback((id, updates) => {
    updateExpenseStorage(id, updates);
    setExpensesState((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updates } : e))
    );
  }, []);

  const removeExpense = useCallback((id) => {
    deleteExpenseStorage(id);
    setExpensesState((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const toggleSettle = useCallback((id) => {
    toggleSettleStorage(id);
    setExpensesState((prev) =>
      prev.map((e) =>
        e.id === id
          ? { ...e, settled: !e.settled, settledAt: !e.settled ? new Date().toISOString() : null }
          : e
      )
    );
  }, []);

  const settle = useCallback((ids) => {
    settleExpensesStorage(ids);
    setExpensesState((prev) =>
      prev.map((e) =>
        ids.includes(e.id)
          ? { ...e, settled: true, settledAt: new Date().toISOString() }
          : e
      )
    );
  }, []);

  return {
    settings,
    updateSettings,
    expenses,
    addExpense,
    editExpense,
    removeExpense,
    toggleSettle,
    settle,
  };
}
