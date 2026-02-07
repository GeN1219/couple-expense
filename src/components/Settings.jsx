import { useState } from 'react';
import { FiPlus, FiTrash2, FiSave } from 'react-icons/fi';

export default function Settings({ settings, onUpdate }) {
  const [users, setUsers] = useState(settings.users);
  const [categories, setCategories] = useState(settings.categories);
  const [newCategory, setNewCategory] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    const trimmedUsers = users.map((u) => u.trim()).filter(Boolean);
    if (trimmedUsers.length !== 2) {
      alert('2人の名前を入力してください');
      return;
    }
    onUpdate({ users: trimmedUsers, categories });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const addCategory = () => {
    const cat = newCategory.trim();
    if (!cat || categories.includes(cat)) return;
    setCategories([...categories, cat]);
    setNewCategory('');
  };

  const removeCategory = (cat) => {
    setCategories(categories.filter((c) => c !== cat));
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <h2 className="text-lg font-bold text-brown-dark">設定</h2>

      {/* User names */}
      <div className="bg-white rounded-xl p-4 border border-beige shadow-sm">
        <h3 className="text-sm font-bold text-brown-dark mb-3">ふたりの名前</h3>
        <div className="space-y-2">
          {users.map((user, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-sm text-warm-gray w-16">
                {i === 0 ? 'ひとり目' : 'ふたり目'}
              </span>
              <input
                type="text"
                value={user}
                onChange={(e) => {
                  const next = [...users];
                  next[i] = e.target.value;
                  setUsers(next);
                }}
                className="flex-1 px-3 py-2 rounded-xl border border-beige bg-white text-brown-dark focus:outline-none focus:ring-2 focus:ring-beige-dark/50"
                placeholder={`パートナー${i + 1}`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div className="bg-white rounded-xl p-4 border border-beige shadow-sm">
        <h3 className="text-sm font-bold text-brown-dark mb-3">カテゴリ</h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {categories.map((cat) => (
            <span
              key={cat}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-cream border border-beige text-sm text-brown"
            >
              {cat}
              <button
                onClick={() => removeCategory(cat)}
                className="text-warm-gray hover:text-danger transition-colors ml-0.5"
              >
                <FiTrash2 className="text-xs" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCategory())}
            placeholder="新しいカテゴリ"
            className="flex-1 px-3 py-2 rounded-xl border border-beige bg-white text-brown-dark placeholder-warm-gray focus:outline-none focus:ring-2 focus:ring-beige-dark/50"
          />
          <button
            onClick={addCategory}
            className="px-4 py-2 rounded-xl bg-cream-dark text-brown hover:bg-beige transition-colors flex items-center gap-1"
          >
            <FiPlus /> 追加
          </button>
        </div>
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        className={`w-full py-3 rounded-xl font-bold text-base shadow-md flex items-center justify-center gap-2 transition-all duration-300 ${
          saved
            ? 'bg-accent-green text-white'
            : 'bg-beige-dark text-white hover:bg-brown'
        }`}
      >
        {saved ? (
          <>✓ 保存しました</>
        ) : (
          <>
            <FiSave /> 設定を保存
          </>
        )}
      </button>
    </div>
  );
}
