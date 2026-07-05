import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../utils/supabase';
import { materializeRecurring } from '../utils/recurring';

export function useSupabaseData(group, members) {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [recurring, setRecurring] = useState([]);
  const [loading, setLoading] = useState(true);

  const groupId = group?.id;
  const users = members.map((m) => m.display_name);

  // Load initial data
  useEffect(() => {
    if (!groupId) return;
    let cancelled = false;

    (async () => {
      const [expRes, catRes, recRes] = await Promise.all([
        supabase.from('expenses').select('*').eq('group_id', groupId).order('created_at', { ascending: false }),
        supabase.from('categories').select('*').eq('group_id', groupId).order('sort_order'),
        supabase.from('recurring_expenses').select('*').eq('group_id', groupId).order('created_at'),
      ]);

      if (!cancelled) {
        setExpenses(expRes.data || []);
        setCategories((catRes.data || []).map((c) => c.name));
        setRecurring(recRes.data || []);
        setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [groupId]);

  // Realtime subscriptions
  useEffect(() => {
    if (!groupId) return;

    const expChannel = supabase
      .channel('expenses-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses', filter: `group_id=eq.${groupId}` }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setExpenses((prev) => {
            if (prev.some((e) => e.id === payload.new.id)) return prev;
            return [payload.new, ...prev];
          });
        } else if (payload.eventType === 'UPDATE') {
          setExpenses((prev) => prev.map((e) => e.id === payload.new.id ? payload.new : e));
        } else if (payload.eventType === 'DELETE') {
          setExpenses((prev) => prev.filter((e) => e.id !== payload.old.id));
        }
      })
      .subscribe();

    const catChannel = supabase
      .channel('categories-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories', filter: `group_id=eq.${groupId}` }, () => {
        // Reload all categories on any change
        supabase.from('categories').select('*').eq('group_id', groupId).order('sort_order').then(({ data }) => {
          setCategories((data || []).map((c) => c.name));
        });
      })
      .subscribe();

    const recChannel = supabase
      .channel('recurring-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'recurring_expenses', filter: `group_id=eq.${groupId}` }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setRecurring((prev) => (prev.some((r) => r.id === payload.new.id) ? prev : [...prev, payload.new]));
        } else if (payload.eventType === 'UPDATE') {
          setRecurring((prev) => prev.map((r) => r.id === payload.new.id ? payload.new : r));
        } else if (payload.eventType === 'DELETE') {
          setRecurring((prev) => prev.filter((r) => r.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(expChannel);
      supabase.removeChannel(catChannel);
      supabase.removeChannel(recChannel);
    };
  }, [groupId]);

  const settings = {
    users,
    categories,
  };

  const addExpense = useCallback(async (expense) => {
    const { data, error } = await supabase
      .from('expenses')
      .insert({ ...expense, group_id: groupId, settled: false })
      .select()
      .single();
    if (error) throw error;
    // Realtime will add it, but add optimistically
    setExpenses((prev) => [data, ...prev]);
    return data;
  }, [groupId]);

  const editExpense = useCallback(async (id, updates) => {
    const { error } = await supabase.from('expenses').update(updates).eq('id', id);
    if (error) throw error;
    setExpenses((prev) => prev.map((e) => e.id === id ? { ...e, ...updates } : e));
  }, []);

  const removeExpense = useCallback(async (id) => {
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) throw error;
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const toggleSettle = useCallback(async (id) => {
    const expense = expenses.find((e) => e.id === id);
    if (!expense) return;
    const newSettled = !expense.settled;
    const updates = { settled: newSettled, settled_at: newSettled ? new Date().toISOString() : null };
    const { error } = await supabase.from('expenses').update(updates).eq('id', id);
    if (error) throw error;
    setExpenses((prev) => prev.map((e) => e.id === id ? { ...e, ...updates } : e));
  }, [expenses]);

  const settle = useCallback(async (ids) => {
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('expenses')
      .update({ settled: true, settled_at: now })
      .in('id', ids);
    if (error) throw error;
    setExpenses((prev) => prev.map((e) => ids.includes(e.id) ? { ...e, settled: true, settled_at: now } : e));
  }, []);

  const updateSettings = useCallback(async (newSettings) => {
    if (newSettings.categories) {
      // Sync categories: delete all, re-insert
      await supabase.from('categories').delete().eq('group_id', groupId);
      await supabase.from('categories').insert(
        newSettings.categories.map((name, i) => ({ group_id: groupId, name, sort_order: i }))
      );
      setCategories(newSettings.categories);
    }
    if (newSettings.users) {
      // Update display names for members
      for (let i = 0; i < members.length && i < newSettings.users.length; i++) {
        await supabase
          .from('group_members')
          .update({ display_name: newSettings.users[i] })
          .eq('id', members[i].id);
      }
    }
  }, [groupId, members]);

  const addRecurring = useCallback(async (rule) => {
    const { data, error } = await supabase
      .from('recurring_expenses')
      .insert({ ...rule, group_id: groupId, active: rule.active ?? true })
      .select()
      .single();
    if (error) throw error;
    setRecurring((prev) => (prev.some((r) => r.id === data.id) ? prev : [...prev, data]));
    return data;
  }, [groupId]);

  const editRecurring = useCallback(async (id, updates) => {
    const { error } = await supabase.from('recurring_expenses').update(updates).eq('id', id);
    if (error) throw error;
    setRecurring((prev) => prev.map((r) => r.id === id ? { ...r, ...updates } : r));
  }, []);

  const removeRecurring = useCallback(async (id) => {
    const { error } = await supabase.from('recurring_expenses').delete().eq('id', id);
    if (error) throw error;
    setRecurring((prev) => prev.filter((r) => r.id !== id));
  }, []);

  // 固定費の自動生成: 未生成の月を補填。DBの部分ユニークインデックスで
  // 二人同時起動時の重複挿入(23505)は握りつぶして安全に保つ。
  const materializing = useRef(false);
  useEffect(() => {
    if (loading || !groupId || materializing.current) return;
    const toInsert = materializeRecurring(recurring, expenses);
    if (toInsert.length === 0) return;

    materializing.current = true;
    (async () => {
      const created = [];
      for (const exp of toInsert) {
        const { data, error } = await supabase
          .from('expenses')
          .insert({ ...exp, group_id: groupId, settled: false })
          .select()
          .single();
        if (error) {
          if (error.code === '23505') continue; // 既に他端末が生成済み
          continue; // その他のエラーもスキップ（次回起動で再試行）
        }
        if (data) created.push(data);
      }
      if (created.length > 0) {
        setExpenses((prev) => {
          const ids = new Set(prev.map((e) => e.id));
          const fresh = created.filter((e) => !ids.has(e.id));
          return [...fresh, ...prev];
        });
      }
      materializing.current = false;
    })();
  }, [loading, groupId, recurring, expenses]);

  return {
    settings,
    expenses,
    loading,
    addExpense,
    editExpense,
    removeExpense,
    toggleSettle,
    settle,
    updateSettings,
    recurring,
    addRecurring,
    editRecurring,
    removeRecurring,
  };
}
