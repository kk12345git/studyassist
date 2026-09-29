import React, { useState, useEffect } from 'react';
import { Download, Smartphone, Check, X, Share } from 'lucide-react';

interface InstallAppButtonProps {
  className?: string;
  variant?: 'nav' | 'hero' | 'floating';
}

export const InstallAppButton: React.FC<InstallAppButtonProps> = ({
  className = '',
  variant = 'nav'
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isInstalled) return;

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else if (isIos) {
      setShowIosGuide(true);
    } else {
      // General instructions fallback
      alert('To install this app on your device:\n• Chrome/Edge: Click the install icon in the URL address bar or browser menu.\n• Mobile: Tap Menu > "Install App" or "Add to Home screen".');
    }
  };

  if (isInstalled) {
    return null;
  }

  return (
    <>
      <button
        onClick={handleInstallClick}
        className={
          className ||
          (variant === 'hero'
            ? 'btn btn-secondary py-3 px-5 text-xs sm:text-sm font-bold flex items-center gap-2 rounded-xl border-indigo-500/30 hover:border-indigo-500/60 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-200 shadow-lg'
            : 'btn btn-secondary btn-sm flex items-center gap-1.5 text-xs font-semibold py-1.5 px-3 rounded-lg border-indigo-500/30 bg-indigo-500/10 text-indigo-300 hover:text-white')
        }
        title="Download & Install App on your device (Android, iOS, Windows, Mac)"
      >
        <Download className="h-3.5 w-3.5 text-indigo-400" />
        <span>Install App</span>
      </button>

      {/* iOS Safari Install Guide Modal */}
      {showIosGuide && (
        <div className="modal-overlay" onClick={() => setShowIosGuide(false)}>
          <div
            className="modal-content max-w-sm p-6 text-slate-100 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-indigo-400" />
                <h3 className="font-bold text-white text-sm">Install on iPhone / iPad</h3>
              </div>
              <button
                onClick={() => setShowIosGuide(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/80 border border-white/5">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white font-bold shrink-0">
                  1
                </div>
                <div>
                  <p className="font-semibold text-white">Tap Share Button</p>
                  <p className="text-slate-400">At the bottom of your Safari screen, tap the <Share className="inline h-3.5 w-3.5 mx-1 text-blue-400" /> Share icon.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/80 border border-white/5">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white font-bold shrink-0">
                  2
                </div>
                <div>
                  <p className="font-semibold text-white">Add to Home Screen</p>
                  <p className="text-slate-400">Scroll down and tap <strong>Add to Home Screen</strong>, then tap <strong>Add</strong> in the top right corner.</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIosGuide(false)}
              className="btn btn-primary w-full py-2.5 text-xs font-bold"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
