import { useState } from 'react';
import { FiPlus, FiTrash2, FiSave, FiLogOut, FiCopy, FiCheck } from 'react-icons/fi';

export default function Settings({ settings, onUpdate, group, onSignOut }) {
  const [users, setUsers] = useState(settings.users);
  const [categories, setCategories] = useState(settings.categories);
  const [newCategory, setNewCategory] = useState('');
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSave = () => {
    const trimmedUsers = users.map((u) => u.trim()).filter(Boolean);
    if (trimmedUsers.length < 1) {
      alert('名前を入力してください');
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

  const copyInviteCode = () => {
    if (group?.invite_code) {
      navigator.clipboard.writeText(group.invite_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <h2 className="text-lg font-bold text-brown-dark">設定</h2>

      {/* Group info (only when online) */}
      {group && (
        <div className="bg-white rounded-xl p-4 border border-beige shadow-sm">
          <h3 className="text-sm font-bold text-brown-dark mb-3">家計簿グループ</h3>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-warm-gray">グループ名</span>
            <span className="text-sm font-medium text-brown-dark">{group.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-warm-gray">招待コード</span>
            <button
              onClick={copyInviteCode}
              className={`flex items-center gap-1 text-sm font-bold px-2 py-1 rounded-lg transition-all ${
                copied ? 'text-accent-green' : 'text-brown-dark hover:bg-cream'
              }`}
            >
              {group.invite_code}
              {copied ? <FiCheck className="text-xs" /> : <FiCopy className="text-xs" />}
            </button>
          </div>
        </div>
      )}

      {/* User names */}
      <div className="bg-white rounded-xl p-4 border border-beige shadow-sm">
        <h3 className="text-sm font-bold text-brown-dark mb-3">メンバーの表示名</h3>
        <div className="space-y-2">
          {users.map((user, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-sm text-warm-gray w-16 shrink-0">
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
                className="min-w-0 flex-1 px-3 py-2 rounded-xl border border-beige bg-white text-brown-dark focus:outline-none focus:ring-2 focus:ring-beige-dark/50"
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
            className="min-w-0 flex-1 px-3 py-2 rounded-xl border border-beige bg-white text-brown-dark placeholder-warm-gray focus:outline-none focus:ring-2 focus:ring-beige-dark/50"
          />
          <button
            onClick={addCategory}
            className="shrink-0 px-3 py-2 rounded-xl bg-cream-dark text-brown hover:bg-beige transition-colors flex items-center gap-1 text-sm"
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

      {/* Logout (only when online) */}
      {onSignOut && (
        <button
          onClick={onSignOut}
          className="w-full py-3 rounded-xl border-2 border-danger/30 text-danger font-bold text-sm hover:bg-danger/5 transition-colors flex items-center justify-center gap-2"
        >
          <FiLogOut /> ログアウト
        </button>
      )}
    </div>
  );
}
