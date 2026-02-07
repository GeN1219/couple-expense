import { useState } from 'react';
import { FiCopy, FiCheck, FiPlus, FiUserPlus } from 'react-icons/fi';

export default function GroupSetup({ onCreateGroup, onJoinGroup }) {
  const [mode, setMode] = useState(null); // null | 'create' | 'join'
  const [groupName, setGroupName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [createdGroup, setCreatedGroup] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!groupName.trim() || !displayName.trim()) return;
    setError('');
    setLoading(true);
    try {
      const group = await onCreateGroup(groupName.trim(), displayName.trim());
      setCreatedGroup(group);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!inviteCode.trim() || !displayName.trim()) return;
    setError('');
    setLoading(true);
    try {
      await onJoinGroup(inviteCode.trim(), displayName.trim());
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(createdGroup.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // After group created - show invite code
  if (createdGroup) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-warm-white">
        <div className="w-full max-w-sm text-center">
          <p className="text-4xl mb-3">🎉</p>
          <h2 className="text-xl font-bold text-brown-dark mb-2">家計簿を作成しました！</h2>
          <p className="text-sm text-warm-gray mb-6">
            下の招待コードをパートナーに共有してください
          </p>

          <div className="bg-white rounded-2xl p-6 border-2 border-beige shadow-md mb-4">
            <p className="text-xs text-warm-gray mb-2">招待コード</p>
            <p className="text-3xl font-bold text-brown-dark tracking-[0.3em] mb-3">
              {createdGroup.invite_code}
            </p>
            <button
              onClick={copyCode}
              className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 mx-auto transition-all ${
                copied
                  ? 'bg-accent-green text-white'
                  : 'bg-cream-dark text-brown hover:bg-beige'
              }`}
            >
              {copied ? <><FiCheck /> コピーしました</> : <><FiCopy /> コードをコピー</>}
            </button>
          </div>

          <p className="text-xs text-warm-gray">
            パートナーがコードを入力して参加すると、<br />一緒に家計簿を使えるようになります。
          </p>

          {/* Proceed anyway - page will reload with group set */}
          <button
            onClick={() => window.location.reload()}
            className="mt-6 w-full py-3 rounded-xl bg-beige-dark text-white font-bold shadow-md hover:bg-brown transition-colors"
          >
            家計簿を始める
          </button>
        </div>
      </div>
    );
  }

  // Mode selection
  if (mode === null) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-warm-white">
        <div className="w-full max-w-sm text-center">
          <p className="text-4xl mb-3">🏠</p>
          <h2 className="text-xl font-bold text-brown-dark mb-2">家計簿のセットアップ</h2>
          <p className="text-sm text-warm-gray mb-8">
            新しく作成するか、招待コードで参加してください
          </p>

          <div className="space-y-3">
            <button
              onClick={() => setMode('create')}
              className="w-full py-4 rounded-xl bg-beige-dark text-white font-bold shadow-md hover:bg-brown transition-colors flex items-center justify-center gap-2"
            >
              <FiPlus /> 新しい家計簿を作成
            </button>
            <button
              onClick={() => setMode('join')}
              className="w-full py-4 rounded-xl bg-white border-2 border-beige text-brown-dark font-bold shadow-sm hover:bg-cream transition-colors flex items-center justify-center gap-2"
            >
              <FiUserPlus /> 招待コードで参加
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Create form
  if (mode === 'create') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-warm-white">
        <div className="w-full max-w-sm">
          <div className="text-center mb-6">
            <p className="text-4xl mb-2">✨</p>
            <h2 className="text-xl font-bold text-brown-dark">新しい家計簿を作成</h2>
          </div>

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-brown mb-1">家計簿の名前</label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="例: ふたりの生活費"
                required
                className="w-full px-3 py-3 rounded-xl border border-beige bg-white text-brown-dark placeholder-warm-gray focus:outline-none focus:ring-2 focus:ring-beige-dark/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-brown mb-1">あなたの表示名</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="例: たろう"
                required
                className="w-full px-3 py-3 rounded-xl border border-beige bg-white text-brown-dark placeholder-warm-gray focus:outline-none focus:ring-2 focus:ring-beige-dark/50"
              />
            </div>

            {error && (
              <p className="text-sm text-danger bg-danger/10 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-beige-dark text-white font-bold shadow-md hover:bg-brown transition-colors disabled:opacity-50"
            >
              {loading ? '作成中...' : '作成する'}
            </button>

            <button
              type="button"
              onClick={() => { setMode(null); setError(''); }}
              className="w-full py-2 text-sm text-warm-gray hover:text-brown transition-colors"
            >
              戻る
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Join form
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-warm-white">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <p className="text-4xl mb-2">🤝</p>
          <h2 className="text-xl font-bold text-brown-dark">招待コードで参加</h2>
        </div>

        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-brown mb-1">招待コード</label>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="例: ABC123"
              required
              maxLength={6}
              className="w-full px-3 py-3 rounded-xl border border-beige bg-white text-brown-dark placeholder-warm-gray text-center text-xl tracking-[0.3em] font-bold focus:outline-none focus:ring-2 focus:ring-beige-dark/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-brown mb-1">あなたの表示名</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="例: はなこ"
              required
              className="w-full px-3 py-3 rounded-xl border border-beige bg-white text-brown-dark placeholder-warm-gray focus:outline-none focus:ring-2 focus:ring-beige-dark/50"
            />
          </div>

          {error && (
            <p className="text-sm text-danger bg-danger/10 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-beige-dark text-white font-bold shadow-md hover:bg-brown transition-colors disabled:opacity-50"
          >
            {loading ? '参加中...' : '参加する'}
          </button>

          <button
            type="button"
            onClick={() => { setMode(null); setError(''); }}
            className="w-full py-2 text-sm text-warm-gray hover:text-brown transition-colors"
          >
            戻る
          </button>
        </form>
      </div>
    </div>
  );
}
