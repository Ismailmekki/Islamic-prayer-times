import React, { useState } from 'react';
import { Download, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { PWAInstallModal } from './PWAInstallModal';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'nav' | 'hero' | 'floating' | 'card';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'nav',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Suppress button if already running as installed standalone PWA
  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (!success) {
        setIsModalOpen(true);
      }
    } else {
      setIsModalOpen(true);
    }
  };

  if (variant === 'nav') {
    return (
      <>
        <button
          onClick={handleClick}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600/90 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-950/50 border border-emerald-400/30 transition-all cursor-pointer whitespace-nowrap active:scale-95 ${className}`}
          title="تثبيت التطبيق على جهازك (آيفون وأندرويد)"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">تثبيت التطبيق</span>
          <span className="sm:hidden">تثبيت</span>
        </button>

        <PWAInstallModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </>
    );
  }

  if (variant === 'hero') {
    return (
      <>
        <div className={`p-4 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-stone-900 to-stone-900 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 ${className}`}>
          <div className="flex items-center gap-3 text-right">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white font-bold text-xs sm:text-sm">
                احصل على التطبيق على شاشة هاتفك
              </h4>
              <p className="text-[11px] text-stone-400">
                يعمل بدون إنترنت على الآيفون والأندرويد بتثبيت فوري خفيف
              </p>
            </div>
          </div>

          <button
            onClick={handleClick}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-700/30 flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95 shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>تنزيل وتثبيت</span>
          </button>
        </div>

        <PWAInstallModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </>
    );
  }

  return (
    <>
      <button
        onClick={handleClick}
        className={`flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-emerald-500 transition cursor-pointer ${className}`}
      >
        <Download className="w-4 h-4" />
        <span>تثبيت التطبيق</span>
      </button>

      <PWAInstallModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};
