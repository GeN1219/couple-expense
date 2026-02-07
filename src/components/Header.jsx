import { FiHome, FiPlusCircle, FiDollarSign, FiBarChart2, FiCalendar, FiSettings } from 'react-icons/fi';

const tabs = [
  { id: 'home', label: 'ホーム', icon: FiHome },
  { id: 'add', label: '追加', icon: FiPlusCircle },
  { id: 'calendar', label: 'カレンダー', icon: FiCalendar },
  { id: 'settle', label: '精算', icon: FiDollarSign },
  { id: 'chart', label: 'グラフ', icon: FiBarChart2 },
  { id: 'settings', label: '設定', icon: FiSettings },
];

export default function Header({ currentTab, onTabChange }) {
  return (
    <>
      {/* Top bar */}
      <header className="bg-cream-dark/80 backdrop-blur-sm border-b border-beige/50 sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-center">
          <h1 className="text-lg font-bold text-brown-dark tracking-wide">
            💰 ふたりの家計簿
          </h1>
        </div>
      </header>

      {/* Bottom navigation (mobile-style) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-cream-dark/90 backdrop-blur-sm border-t border-beige/50 z-30 safe-bottom">
        <div className="max-w-2xl mx-auto flex">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex-1 flex flex-col items-center py-2 pt-2.5 transition-colors duration-200 ${
                  isActive
                    ? 'text-brown-dark'
                    : 'text-warm-gray hover:text-brown'
                }`}
              >
                <Icon className={`text-lg mb-0.5 ${isActive ? 'scale-110' : ''} transition-transform`} />
                <span className={`text-[9px] ${isActive ? 'font-bold' : ''}`}>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
