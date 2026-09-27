import React from 'react';
import { Compass, Volume2, MapPin, Moon, Bell } from 'lucide-react';
import { UserLocation } from '../types/prayer';
import { PWAInstallButton } from './PWAInstallButton';

interface TopNavProps {
  currentTab: string;
  onSelectTab: (tabId: string) => void;
  location: UserLocation;
  onOpenLocationModal: () => void;
  onTriggerAdhan: () => void;
  isAdhanPlaying: boolean;
}

export const TopNav: React.FC<TopNavProps> = ({
  currentTab,
  onSelectTab,
  location,
  onOpenLocationModal,
  onTriggerAdhan,
  isAdhanPlaying,
}) => {
  const navItems = [
    { id: 'prayers', label: 'مواقيت الصلاة' },
    { id: 'tasbih', label: 'السبحة الإلكترونية' },
    { id: 'adhan', label: 'رفع الأذان' },
    { id: 'qibla', label: 'اتجاه القبلة' },
    { id: 'mosques', label: 'المساجد القريبة' },
    { id: 'quran', label: 'القرآن والرقية' },
    { id: 'ibrahimiya', label: 'الصلاة الإبراهيمية' },
    { id: 'adhkar', label: 'الأذكار والأدعية' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#061514]/90 backdrop-blur-xl border-b border-emerald-500/20 shadow-lg shadow-emerald-950/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-[64px] py-1.5 flex items-center justify-between gap-4">
        {/* Zone 1: Single text element wordmark + رفع الأذان أسفل صلاتي */}
        <div className="flex flex-col items-start justify-center shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-br from-emerald-500/30 via-emerald-800/40 to-amber-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shadow-sm shadow-emerald-500/20">
              <Moon className="w-4 h-4 fill-emerald-300/30" />
            </div>
            <button
              onClick={() => onSelectTab('prayers')}
              className="text-xl sm:text-2xl font-black tracking-tight bg-gradient-to-l from-amber-200 via-emerald-100 to-white bg-clip-text text-transparent hover:from-amber-300 hover:to-emerald-200 transition-all text-right leading-none cursor-pointer drop-shadow-xs"
            >
              صلاتي
            </button>
          </div>

          {/* زر رفع الأذان أسفل صلاتي مباشرة */}
          <button
            onClick={onTriggerAdhan}
            className={`mt-1 flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold transition-all whitespace-nowrap cursor-pointer mr-9 ${
              isAdhanPlaying
                ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-white animate-pulse shadow-md shadow-amber-600/40 border border-amber-400'
                : 'bg-gradient-to-r from-emerald-950/90 via-emerald-900/80 to-teal-950/90 hover:from-emerald-850 hover:to-teal-900 text-emerald-200 border border-emerald-400/40 hover:border-amber-400/60 shadow-xs'
            }`}
            title="سماع ورفع الأذان الآن"
          >
            <Volume2 className="w-3 h-3 text-amber-300 shrink-0" />
            <span>{isAdhanPlaying ? 'الأذان يرفع الآن' : 'رفع الأذان'}</span>
          </button>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`px-3 py-1.5 text-xs xl:text-sm font-medium rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'text-amber-200 bg-gradient-to-r from-emerald-900/80 to-teal-900/80 border border-amber-400/30 shadow-xs shadow-emerald-950 font-bold'
                    : 'text-stone-300 hover:text-white hover:bg-emerald-950/40 hover:border-emerald-500/20 border border-transparent'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* In-App PWA Install Button for iPhone & Android */}
          <PWAInstallButton variant="nav" />

          {/* Notifications & Reminders Settings button */}
          <button
            onClick={onOpenLocationModal}
            className="p-2 text-amber-300 hover:text-amber-200 bg-[#08201d]/90 hover:bg-[#0c2a26] border border-emerald-500/30 rounded-xl transition-all shadow-xs cursor-pointer"
            title="إعدادات التطبيق وتنبيهات الأذان"
          >
            <Bell className="w-4 h-4" />
          </button>

          {/* Location button */}
          <button
            onClick={onOpenLocationModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-100 bg-[#08201d]/90 hover:bg-[#0c2a26] border border-emerald-500/30 hover:border-emerald-400/60 rounded-xl transition-all shadow-xs whitespace-nowrap cursor-pointer"
            title="تغيير الموقع الجغرافي"
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="max-w-[100px] sm:max-w-[140px] truncate">{location.cityName}</span>
          </button>
        </div>
      </div>

      {/* Mobile Horizontal Sub-nav (Pattern 1 & Thumb zone) */}
      <div className="lg:hidden border-t border-emerald-900/40 bg-[#061413]/95 px-2 py-1.5 overflow-x-auto no-scrollbar flex items-center gap-1">
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`px-3 py-1 text-xs font-medium rounded-lg whitespace-nowrap shrink-0 transition-colors ${
                isActive
                  ? 'text-amber-200 bg-emerald-900/70 border border-amber-400/30 font-bold'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </header>
  );
};
