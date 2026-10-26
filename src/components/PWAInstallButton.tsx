import React, { useState } from 'react';
import { Download, Smartphone, ShieldCheck, Sparkles } from 'lucide-react';
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
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetTab, setTargetTab] = useState<'ios' | 'android' | 'qr' | 'setup' | undefined>(undefined);

  // Suppress button if already running as installed standalone PWA
  if (isInstalled) {
    return null;
  }

  const handleOpenModal = (tab?: 'ios' | 'android' | 'qr' | 'setup') => {
    setTargetTab(tab || (isIOS ? 'ios' : 'android'));
    setIsModalOpen(true);
  };

  const handleQuickInstall = async () => {
    if (isInstallable) {
      const success = await install();
      if (!success) {
        handleOpenModal(isIOS ? 'ios' : 'android');
      }
    } else {
      handleOpenModal(isIOS ? 'ios' : 'android');
    }
  };

  if (variant === 'nav') {
    return (
      <>
        <button
          onClick={handleQuickInstall}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-500 hover:brightness-110 text-white shadow-md shadow-emerald-950/80 border border-emerald-400/40 transition-all cursor-pointer whitespace-nowrap active:scale-95 ${className}`}
          title="تحميل وتثبيت التطبيق على جهازك (آيفون وأندرويد)"
        >
          <Download className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">تحميل التطبيق على الهاتف</span>
          <span className="sm:hidden">تحميل التطبيق</span>
        </button>

        <PWAInstallModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          defaultTab={targetTab}
        />
      </>
    );
  }

  if (variant === 'hero') {
    return (
      <>
        <div
          dir="rtl"
          className={`p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-[#07241e] via-stone-900 to-stone-900 border-2 border-emerald-500/40 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4 ${className}`}
        >
          {/* Info text */}
          <div className="flex items-center gap-3.5 text-right w-full md:w-auto">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-white font-black text-sm sm:text-base font-quran">
                  تحميل تطبيق «صلاتي» على شاشة هاتفك
                </h4>
                <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/40 font-bold">
                  تثبيت مجاني سريع
                </span>
              </div>
              <p className="text-xs text-stone-300 mt-0.5">
                يعمل بدون متجر وبدون إنترنت على الآيفون والأندرويد مع رفع الأذان تلقائياً
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
            <button
              onClick={() => handleOpenModal('android')}
              className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm shadow-md flex items-center justify-center gap-1.5 cursor-pointer transition-transform active:scale-95"
            >
              <Smartphone className="w-4 h-4" />
              <span>هواتف الأندرويد 🤖</span>
            </button>

            <button
              onClick={() => handleOpenModal('ios')}
              className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-sky-700 hover:bg-sky-600 text-white font-black text-xs sm:text-sm shadow-md flex items-center justify-center gap-1.5 cursor-pointer transition-transform active:scale-95"
            >
              <Smartphone className="w-4 h-4" />
              <span>هواتف الآيفون 🍏</span>
            </button>

            <button
              onClick={() => handleOpenModal('setup')}
              className="px-3.5 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-300 hover:text-white border border-stone-700 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              title="فحص الإعدادات وتأكيد الصوت والتنبيهات"
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>فحص الـ Setup</span>
            </button>
          </div>
        </div>

        <PWAInstallModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          defaultTab={targetTab}
        />
      </>
    );
  }

  return (
    <>
      <button
        onClick={handleQuickInstall}
        className={`flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-500 transition cursor-pointer ${className}`}
      >
        <Download className="w-4 h-4" />
        <span>تثبيت التطبيق على الهاتف</span>
      </button>

      <PWAInstallModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultTab={targetTab}
      />
    </>
  );
};
