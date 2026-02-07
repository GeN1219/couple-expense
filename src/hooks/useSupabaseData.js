import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabase';

export function useSupabaseData(group, members) {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const groupId = group?.id;
  const users = members.map((m) => m.display_name);

  // Load initial data
  useEffect(() => {
    if (!groupId) return;
    let cancelled = false;

    (async () => {
      const [expRes, catRes] = await Promise.all([
        supabase.from('expenses').select('*').eq('group_id', groupId).order('created_at', { ascending: false }),
        supabase.from('categories').select('*').eq('group_id', groupId).order('sort_order'),
      ]);

      if (!cancelled) {
        setExpenses(expRes.data || []);
        setCategories((catRes.data || []).map((c) => c.name));
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

    return () => {
      supabase.removeChannel(expChannel);
      supabase.removeChannel(catChannel);
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
  };
}
