import { useState, useCallback, useEffect, useRef } from 'react';
import {
  getSettings,
  saveSettings,
  getExpenses,
  addExpense as addExpenseStorage,
  updateExpense as updateExpenseStorage,
  deleteExpense as deleteExpenseStorage,
  toggleSettleExpense as toggleSettleStorage,
  settleExpenses as settleExpensesStorage,
  getRecurring,
  addRecurring as addRecurringStorage,
  updateRecurring as updateRecurringStorage,
  deleteRecurring as deleteRecurringStorage,
} from '../utils/storage';
import { materializeRecurring } from '../utils/recurring';

export function useAppData() {
  const [settings, setSettingsState] = useState(getSettings);
  const [expenses, setExpensesState] = useState(getExpenses);
  const [recurring, setRecurringState] = useState(getRecurring);

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

  const addRecurring = useCallback((rule) => {
    const newRule = addRecurringStorage(rule);
    setRecurringState((prev) => [...prev, newRule]);
    return newRule;
  }, []);

  const editRecurring = useCallback((id, updates) => {
    updateRecurringStorage(id, updates);
    setRecurringState((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));
  }, []);

  const removeRecurring = useCallback((id) => {
    deleteRecurringStorage(id);
    setRecurringState((prev) => prev.filter((r) => r.id !== id));
  }, []);

  // 固定費の自動生成: recurring or expenses が変わったら未生成分を補填
  const materializing = useRef(false);
  useEffect(() => {
    if (materializing.current) return;
    const toInsert = materializeRecurring(recurring, expenses);
    if (toInsert.length === 0) return;
    materializing.current = true;
    const created = toInsert.map((exp) => addExpenseStorage(exp));
    setExpensesState((prev) => [...created.reverse(), ...prev]);
    materializing.current = false;
  }, [recurring, expenses]);

  return {
    settings,
    updateSettings,
    expenses,
    addExpense,
    editExpense,
    removeExpense,
    toggleSettle,
    settle,
    recurring,
    addRecurring,
    editRecurring,
    removeRecurring,
  };
}
