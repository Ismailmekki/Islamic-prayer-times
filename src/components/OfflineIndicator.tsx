import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  const [showReconnected, setShowReconnected] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      setTimeout(() => setShowReconnected(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !showReconnected) return null;

  if (showReconnected) {
    return (
      <div className="fixed top-20 right-4 left-4 sm:left-auto z-50 flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xl animate-in slide-in-from-top">
        <Wifi className="w-4 h-4 shrink-0" />
        <span>تمت استعادة الاتصال بالإنترنت بنجاح.</span>
      </div>
    );
  }

  return (
    <div className="fixed bottom-20 lg:bottom-4 left-4 right-4 sm:right-auto z-50 flex items-center gap-2.5 rounded-xl bg-amber-600/95 backdrop-blur-md px-4 py-2.5 text-xs font-semibold text-white shadow-2xl border border-amber-400/40 animate-pulse">
      <WifiOff className="w-4 h-4 shrink-0" />
      <div>
        <span>وضع عدم الاتصال: </span>
        <span className="font-normal text-amber-100">
          التطبيق يعمل بشكل كامل أوفلاين مع حساب المواقيت والسبحة والأذكار.
        </span>
      </div>
    </div>
  );
};
