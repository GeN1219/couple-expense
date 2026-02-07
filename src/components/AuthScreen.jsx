import { useState } from 'react';
import { FiMail, FiLock, FiLogIn, FiUserPlus } from 'react-icons/fi';

export default function AuthScreen({ onSignIn, onSignUp }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await onSignIn(email, password);
      } else {
        await onSignUp(email, password);
        setRegistered(true);
      }
    } catch (err) {
      setError(err.message === 'Invalid login credentials'
        ? 'メールアドレスまたはパスワードが正しくありません'
        : err.message);
    }
    setLoading(false);
  };

  if (registered) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-warm-white">
        <div className="w-full max-w-sm">
          <div className="text-center mb-6">
            <p className="text-4xl mb-3">📬</p>
            <h1 className="text-xl font-bold text-brown-dark">確認メールを送信しました</h1>
            <p className="text-sm text-warm-gray mt-2">
              {email} に確認メールを送りました。<br />
              メール内のリンクをクリックして、登録を完了してください。
            </p>
          </div>
          <button
            onClick={() => { setRegistered(false); setMode('login'); }}
            className="w-full py-3 rounded-xl bg-beige-dark text-white font-bold shadow-md hover:bg-brown transition-colors"
          >
            ログイン画面に戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-warm-white">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <p className="text-4xl mb-2">💰</p>
          <h1 className="text-xl font-bold text-brown-dark">ふたりの家計簿</h1>
          <p className="text-sm text-warm-gray mt-1">
            {mode === 'login' ? 'ログインして始めましょう' : '新しいアカウントを作成'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="メールアドレス"
              required
              className="w-full pl-10 pr-3 py-3 rounded-xl border border-beige bg-white text-brown-dark placeholder-warm-gray focus:outline-none focus:ring-2 focus:ring-beige-dark/50"
            />
          </div>

          <div className="relative">
            <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="パスワード（6文字以上）"
              required
              minLength={6}
              className="w-full pl-10 pr-3 py-3 rounded-xl border border-beige bg-white text-brown-dark placeholder-warm-gray focus:outline-none focus:ring-2 focus:ring-beige-dark/50"
            />
          </div>

          {error && (
            <p className="text-sm text-danger bg-danger/10 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-beige-dark text-white font-bold text-base shadow-md hover:bg-brown transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="animate-pulse">処理中...</span>
            ) : mode === 'login' ? (
              <><FiLogIn /> ログイン</>
            ) : (
              <><FiUserPlus /> アカウント作成</>
            )}
          </button>
        </form>

        {/* Toggle */}
        <p className="text-center text-sm text-warm-gray mt-6">
          {mode === 'login' ? (
            <>
              アカウントをお持ちでない方は{' '}
              <button onClick={() => { setMode('register'); setError(''); }} className="text-brown-dark font-bold underline">
                新規登録
              </button>
            </>
          ) : (
            <>
              既にアカウントをお持ちの方は{' '}
              <button onClick={() => { setMode('login'); setError(''); }} className="text-brown-dark font-bold underline">
                ログイン
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
