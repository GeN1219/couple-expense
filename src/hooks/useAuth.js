import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseEnabled } from '../utils/supabase';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Listen for auth changes
  useEffect(() => {
    if (!isSupabaseEnabled()) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadGroup(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadGroup(session.user.id);
      } else {
        setGroup(null);
        setMembers([]);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadGroup = async (userId) => {
    try {
      const { data: membership } = await supabase
        .from('group_members')
        .select('group_id, display_name, household_groups(*)')
        .eq('user_id', userId)
        .limit(1)
        .single();

      if (membership) {
        setGroup(membership.household_groups);
        const { data: allMembers } = await supabase
          .from('group_members')
          .select('*')
          .eq('group_id', membership.group_id);
        setMembers(allMembers || []);
      } else {
        setGroup(null);
        setMembers([]);
      }
    } catch {
      setGroup(null);
      setMembers([]);
    }
    setLoading(false);
  };

  const signUp = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  }, []);

  const signIn = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setGroup(null);
    setMembers([]);
  }, []);

  const createGroup = useCallback(async (groupName, displayName) => {
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const { data: newGroup, error: groupError } = await supabase
      .from('household_groups')
      .insert({ name: groupName, invite_code: inviteCode })
      .select()
      .single();
    if (groupError) throw groupError;

    const { error: memberError } = await supabase
      .from('group_members')
      .insert({ group_id: newGroup.id, user_id: user.id, display_name: displayName });
    if (memberError) throw memberError;

    // Insert default categories
    const defaultCategories = ['食費', '日用品', '旅行', '娯楽', '交通費', '外食', '光熱費', 'その他'];
    await supabase
      .from('categories')
      .insert(defaultCategories.map((name, i) => ({ group_id: newGroup.id, name, sort_order: i })));

    setGroup(newGroup);
    setMembers([{ group_id: newGroup.id, user_id: user.id, display_name: displayName }]);
    return newGroup;
  }, [user]);

  const joinGroup = useCallback(async (inviteCode, displayName) => {
    const { data: foundGroup, error: findError } = await supabase
      .from('household_groups')
      .select('*')
      .eq('invite_code', inviteCode.toUpperCase())
      .single();
    if (findError || !foundGroup) throw new Error('招待コードが見つかりません');

    // Check member count
    const { data: existingMembers } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', foundGroup.id);
    if (existingMembers && existingMembers.length >= 2) {
      throw new Error('この家計簿は既に2人参加しています');
    }

    const { error: joinError } = await supabase
      .from('group_members')
      .insert({ group_id: foundGroup.id, user_id: user.id, display_name: displayName });
    if (joinError) throw joinError;

    await loadGroup(user.id);
    return foundGroup;
  }, [user]);

  return {
    user,
    group,
    members,
    loading,
    signUp,
    signIn,
    signOut,
    createGroup,
    joinGroup,
    isOnline: isSupabaseEnabled(),
  };
}
