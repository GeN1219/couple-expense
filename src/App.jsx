import { useState } from 'react';
import { isSupabaseEnabled } from './utils/supabase';
import { useAuth } from './hooks/useAuth';
import { useAppData } from './hooks/useAppData';
import { useSupabaseData } from './hooks/useSupabaseData';
import AuthScreen from './components/AuthScreen';
import GroupSetup from './components/GroupSetup';
import Header from './components/Header';
import Home from './components/Home';
import ExpenseForm from './components/ExpenseForm';
import ExpenseList from './components/ExpenseList';
import Settlement from './components/Settlement';
import Charts from './components/Charts';
import Settings from './components/Settings';

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-warm-white">
      <div className="text-center">
        <p className="text-4xl mb-3 animate-bounce">💰</p>
        <p className="text-sm text-warm-gray animate-pulse">読み込み中...</p>
      </div>
    </div>
  );
}

function OnlineApp({ auth }) {
  const { group, members, signOut } = auth;
  const data = useSupabaseData(group, members);
  const [currentTab, setCurrentTab] = useState('home');

  if (data.loading) return <LoadingScreen />;

  const handleAdd = (expense) => {
    data.addExpense(expense);
    setCurrentTab('home');
  };

  return (
    <div className="font-sans pb-20 min-h-screen">
      <Header currentTab={currentTab} onTabChange={setCurrentTab} />
      <main>
        {currentTab === 'home' && (
          <Home expenses={data.expenses} settings={data.settings} onTabChange={setCurrentTab} />
        )}
        {currentTab === 'add' && (
          <>
            <ExpenseForm settings={data.settings} onAdd={handleAdd} />
            <ExpenseList
              expenses={data.expenses}
              settings={data.settings}
              onEdit={data.editExpense}
              onDelete={data.removeExpense}
              onToggleSettle={data.toggleSettle}
            />
          </>
        )}
        {currentTab === 'settle' && (
          <Settlement expenses={data.expenses} settings={data.settings} onToggleSettle={data.toggleSettle} onSettle={data.settle} />
        )}
        {currentTab === 'chart' && (
          <Charts expenses={data.expenses} settings={data.settings} />
        )}
        {currentTab === 'settings' && (
          <Settings settings={data.settings} onUpdate={data.updateSettings} group={group} onSignOut={signOut} />
        )}
      </main>
    </div>
  );
}

function OfflineApp() {
  const [currentTab, setCurrentTab] = useState('home');
  const { settings, updateSettings, expenses, addExpense, editExpense, removeExpense, toggleSettle, settle } = useAppData();

  const handleAdd = (expense) => {
    addExpense(expense);
    setCurrentTab('home');
  };

  return (
    <div className="font-sans pb-20 min-h-screen">
      <Header currentTab={currentTab} onTabChange={setCurrentTab} />
      <main>
        {currentTab === 'home' && (
          <Home expenses={expenses} settings={settings} onTabChange={setCurrentTab} />
        )}
        {currentTab === 'add' && (
          <>
            <ExpenseForm settings={settings} onAdd={handleAdd} />
            <ExpenseList
              expenses={expenses}
              settings={settings}
              onEdit={editExpense}
              onDelete={removeExpense}
              onToggleSettle={toggleSettle}
            />
          </>
        )}
        {currentTab === 'settle' && (
          <Settlement expenses={expenses} settings={settings} onToggleSettle={toggleSettle} onSettle={settle} />
        )}
        {currentTab === 'chart' && (
          <Charts expenses={expenses} settings={settings} />
        )}
        {currentTab === 'settings' && (
          <Settings settings={settings} onUpdate={updateSettings} />
        )}
      </main>
    </div>
  );
}

export default function App() {
  // Offline mode: no Supabase credentials
  if (!isSupabaseEnabled()) {
    return <OfflineApp />;
  }

  // Online mode: Supabase enabled
  return <OnlineAppWrapper />;
}

function OnlineAppWrapper() {
  const auth = useAuth();

  if (auth.loading) return <LoadingScreen />;

  // Not logged in
  if (!auth.user) {
    return <AuthScreen onSignIn={auth.signIn} onSignUp={auth.signUp} />;
  }

  // Logged in but no group
  if (!auth.group) {
    return <GroupSetup onCreateGroup={auth.createGroup} onJoinGroup={auth.joinGroup} />;
  }

  // Fully set up
  return <OnlineApp auth={auth} />;
}
