import { useState, useEffect } from 'react';
import { FiDownload, FiX } from 'react-icons/fi';

const DISMISS_KEY = 'pwa-install-dismissed';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Already dismissed permanently
    if (localStorage.getItem(DISMISS_KEY)) return;

    // Already installed as PWA
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    // iOS detection
    const ua = navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
    setIsIOS(ios);

    if (ios) {
      // Show iOS instruction banner
      setShowBanner(true);
      return;
    }

    // Android / Desktop: listen for beforeinstallprompt
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1');
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 safe-top">
      <div className="mx-3 mt-3 p-3 rounded-xl bg-white border border-beige shadow-lg flex items-center gap-3">
        <div className="shrink-0 w-10 h-10 rounded-xl bg-cream flex items-center justify-center">
          <FiDownload className="text-brown text-lg" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-brown-dark">ホーム画面に追加</p>
          {isIOS ? (
            <p className="text-xs text-warm-gray leading-tight mt-0.5">
              Safari の共有ボタン
              <span className="inline-block mx-0.5 text-base align-middle">⬆</span>
              →「ホーム画面に追加」
            </p>
          ) : (
            <p className="text-xs text-warm-gray leading-tight mt-0.5">
              アプリとしてインストールできます
            </p>
          )}
        </div>
        {!isIOS && (
          <button
            onClick={handleInstall}
            className="shrink-0 px-3 py-1.5 rounded-lg bg-beige-dark text-white text-xs font-bold hover:bg-brown transition-colors"
          >
            追加
          </button>
        )}
        <button
          onClick={handleDismiss}
          className="shrink-0 p-1 rounded-lg text-warm-gray hover:bg-cream transition-colors"
        >
          <FiX className="text-sm" />
        </button>
      </div>
    </div>
  );
}
