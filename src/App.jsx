import { useState } from 'react';
import { useAppData } from './hooks/useAppData';
import Header from './components/Header';
import Home from './components/Home';
import ExpenseForm from './components/ExpenseForm';
import ExpenseList from './components/ExpenseList';
import Settlement from './components/Settlement';
import Charts from './components/Charts';
import Settings from './components/Settings';

export default function App() {
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
