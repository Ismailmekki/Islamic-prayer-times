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
    { id: 'adhkar', label: 'أذكار الصباح والمساء' },
    { id: 'quran', label: 'القرآن والرقية' },
    { id: 'qibla', label: 'القبلة' },
    { id: 'tasbih', label: 'السبحة الإلكترونية' },
    { id: 'adhan', label: 'رفع الأذان' },
    { id: 'ibrahimiya', label: 'الصلاة الإبراهيمية' },
    { id: 'mosques', label: 'المساجد القريبة' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-stone-900/95 backdrop-blur-md border-b border-emerald-900/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-[64px] py-1.5 flex items-center justify-between gap-4">
        {/* Zone 1: Single text element wordmark + رفع الأذان أسفل صلاتي */}
        <div className="flex flex-col items-start justify-center shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-700/30 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Moon className="w-4 h-4 fill-emerald-400/30" />
            </div>
            <button
              onClick={() => onSelectTab('prayers')}
              className="text-lg sm:text-xl font-bold tracking-tight text-white hover:text-emerald-400 transition-colors text-right leading-none cursor-pointer"
            >
              صلاتي
            </button>
          </div>

          {/* زر رفع الأذان أسفل صلاتي مباشرة */}
          <button
            onClick={onTriggerAdhan}
            className={`mt-1 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-all whitespace-nowrap cursor-pointer mr-9 ${
              isAdhanPlaying
                ? 'bg-amber-600 text-white animate-pulse shadow-sm shadow-amber-600/30'
                : 'bg-emerald-950/90 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40 hover:border-emerald-400 shadow-xs'
            }`}
            title="سماع ورفع الأذان الآن"
          >
            <Volume2 className="w-3 h-3 text-emerald-400 shrink-0" />
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
                className={`px-3 py-1.5 text-xs xl:text-sm font-medium rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? 'text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 shadow-xs'
                    : 'text-stone-300 hover:text-white hover:bg-stone-800/60'
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
            className="p-2 text-stone-300 hover:text-white bg-stone-800/90 hover:bg-stone-700 border border-stone-700 rounded-lg transition-colors cursor-pointer"
            title="إعدادات التطبيق وتنبيهات الأذان"
          >
            <Bell className="w-4 h-4 text-amber-400" />
          </button>

          {/* Location button */}
          <button
            onClick={onOpenLocationModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-200 bg-stone-800/90 hover:bg-stone-700/90 border border-stone-700 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            title="تغيير الموقع الجغرافي"
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="max-w-[100px] sm:max-w-[140px] truncate">{location.cityName}</span>
          </button>
        </div>
      </div>

      {/* Mobile Horizontal Sub-nav (Pattern 1 & Thumb zone) */}
      <div className="lg:hidden border-t border-stone-800/80 bg-stone-900/90 px-2 py-1.5 overflow-x-auto no-scrollbar flex items-center gap-1">
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
                isActive
                  ? 'text-emerald-400 bg-emerald-950/70 border border-emerald-500/30'
                  : 'text-stone-400 hover:text-stone-200'
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
