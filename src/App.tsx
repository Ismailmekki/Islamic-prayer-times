/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { TopNav } from './components/TopNav';
import { PrayerTimesCard } from './components/PrayerTimesCard';
import { AdhanSection } from './components/AdhanSection';
import { QiblaCompass } from './components/QiblaCompass';
import { MosquesMap } from './components/MosquesMap';
import { QuranReader } from './components/QuranReader';
import { SalatIbrahimiyaSection } from './components/SalatIbrahimiyaSection';
import { DuasAndAdhkar } from './components/DuasAndAdhkar';
import { ElectronicTasbih } from './components/ElectronicTasbih';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';
import { CitySelectorModal } from './components/CitySelectorModal';
import { AdhanPlayerModal } from './components/AdhanPlayerModal';
import { CalculationMethodId, JuristicMethod, UserLocation, AdhanVoice } from './types/prayer';
import { ADHAN_VOICES } from './data/adhanSounds';
import { calculateDailyPrayerTimes, getPrayerList } from './utils/prayerTimes';
import { COUNTRIES_AND_STATES } from './data/countriesAndStates';
import { backgroundAdhanService } from './services/backgroundAdhanService';
import { Clock, Volume2, Compass, MapPin, BookOpen, Sparkles, Heart, CircleDot } from 'lucide-react';

export default function App() {
  // Navigation tab state
  const [currentTab, setCurrentTab] = useState<string>('prayers');

  // Location state: Default to Makkah Al-Mukarramah or previous stored
  const [location, setLocation] = useState<UserLocation>(() => {
    const saved = localStorage.getItem('noor_user_location');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return {
      cityName: 'مكة المكرمة',
      countryName: 'المملكة العربية السعودية',
      latitude: 21.4225,
      longitude: 39.8262,
      timezone: 'Asia/Riyadh',
      isAutoGPS: false,
    };
  });

  // Prayer Calculation Method & Juristic Method
  const [calculationMethod, setCalculationMethod] = useState<CalculationMethodId>('MAKKAH');
  const [juristicMethod, setJuristicMethod] = useState<JuristicMethod>('standard');

  // Adhan state
  const [selectedVoice, setSelectedVoice] = useState<AdhanVoice>(ADHAN_VOICES[0]);
  const [isAdhanModalOpen, setIsAdhanModalOpen] = useState(false);
  const [activeAdhanPrayerName, setActiveAdhanPrayerName] = useState<string>('الصلاة');

  // City Selector Modal
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  // Initialize background prayer monitor and trigger listeners
  useEffect(() => {
    backgroundAdhanService.setOnAdhanTrigger((prayerName, voice) => {
      setSelectedVoice(voice);
      setActiveAdhanPrayerName(prayerName);
      setIsAdhanModalOpen(true);
    });

    backgroundAdhanService.startPrayerMonitor(() => {
      const now = new Date();
      const times = calculateDailyPrayerTimes(
        now,
        location.latitude,
        location.longitude,
        calculationMethod,
        juristicMethod
      );
      const prayerList = getPrayerList(times, now);
      return {
        prayerList,
        cityName: location.cityName,
        selectedVoice,
      };
    });

    return () => {
      backgroundAdhanService.stopPrayerMonitor();
    };
  }, [location, calculationMethod, juristicMethod, selectedVoice]);

  // Save location updates to localStorage
  useEffect(() => {
    localStorage.setItem('noor_user_location', JSON.stringify(location));
  }, [location]);

  // Attempt silent GPS geolocation once on startup if not yet set
  useEffect(() => {
    if (!navigator.geolocation || location.isAutoGPS) return;
    
    // Check if we can get user's position
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        
        // Search through all states across all countries for closest match
        let closestState = COUNTRIES_AND_STATES[0].states[0];
        let closestCountry = COUNTRIES_AND_STATES[0];
        let minDist = 999999;

        for (const country of COUNTRIES_AND_STATES) {
          for (const state of country.states) {
            const d = Math.hypot(state.latitude - lat, state.longitude - lon);
            if (d < minDist) {
              minDist = d;
              closestState = state;
              closestCountry = country;
            }
          }
        }

        // If within ~0.6 deg (~60km) of a known state/province, label with exact state
        if (minDist < 0.6) {
          setLocation({
            latitude: lat,
            longitude: lon,
            cityName: `${closestCountry.stateLabelArabic} ${closestState.nameArabic}`,
            countryName: closestCountry.countryNameArabic,
            timezone: closestCountry.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
            isAutoGPS: true,
          });
          if (closestCountry.defaultMethod) {
            setCalculationMethod(closestCountry.defaultMethod);
          }
        } else {
          setLocation({
            latitude: lat,
            longitude: lon,
            cityName: 'موقعي الحالي (GPS)',
            countryName: closestCountry.countryNameArabic || '',
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            isAutoGPS: true,
          });
        }
      },
      () => {
        // Geolocation denied or unavailable; stick with default
      },
      { timeout: 8000 }
    );
  }, []);

  const handleTriggerAdhan = (prayerName = 'الصلاة', voice?: AdhanVoice) => {
    if (voice) {
      setSelectedVoice(voice);
    }
    setActiveAdhanPrayerName(prayerName);
    setIsAdhanModalOpen(true);
  };

  // Mobile Bottom Tab Bar items (Pattern 1 of touch mobile design)
  const mobileBottomTabs = [
    { id: 'prayers', label: 'المواقيت', icon: Clock },
    { id: 'tasbih', label: 'السبحة', icon: CircleDot },
    { id: 'adhan', label: 'الأذان', icon: Volume2 },
    { id: 'qibla', label: 'القبلة', icon: Compass },
    { id: 'quran', label: 'القرآن', icon: BookOpen },
    { id: 'adhkar', label: 'الأذكار', icon: Sparkles },
  ];

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col selection:bg-emerald-600 selection:text-white pb-20 lg:pb-8 bg-islamic-pattern">
      {/* Offline connectivity indicator */}
      <OfflineIndicator />

      {/* Top Bar following contract */}
      <TopNav
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        location={location}
        onOpenLocationModal={() => setIsLocationModalOpen(true)}
        onTriggerAdhan={() => handleTriggerAdhan('الصلاة المفروضة')}
        isAdhanPlaying={isAdhanModalOpen}
      />

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Subtle PWA download banner on home screen */}
        {currentTab === 'prayers' && (
          <div className="mb-6">
            <PWAInstallButton variant="hero" />
          </div>
        )}

        {currentTab === 'prayers' && (
          <PrayerTimesCard
            location={location}
            calculationMethod={calculationMethod}
            selectedVoice={selectedVoice}
            onOpenSettings={() => setIsLocationModalOpen(true)}
            onPlayAdhanForPrayer={(prayerName) => handleTriggerAdhan(prayerName)}
          />
        )}

        {currentTab === 'tasbih' && <ElectronicTasbih />}

        {currentTab === 'adhan' && (
          <AdhanSection
            currentVoice={selectedVoice}
            onSelectVoice={(voice) => setSelectedVoice(voice)}
            onTriggerModal={(voice) => handleTriggerAdhan('الصلاة', voice)}
          />
        )}

        {currentTab === 'qibla' && (
          <QiblaCompass
            location={location}
            onOpenLocationModal={() => setIsLocationModalOpen(true)}
            onUpdateLocation={(newLoc) => setLocation(newLoc)}
          />
        )}

        {currentTab === 'mosques' && (
          <MosquesMap
            location={location}
            onOpenLocationModal={() => setIsLocationModalOpen(true)}
            onClose={() => {
              setCurrentTab('prayers');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {currentTab === 'quran' && <QuranReader />}

        {currentTab === 'ibrahimiya' && <SalatIbrahimiyaSection />}

        {currentTab === 'adhkar' && <DuasAndAdhkar />}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-stone-800/80 bg-stone-900/60 py-6 text-center text-xs text-stone-400">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p className="font-quran text-stone-300 text-sm">
            ﴿إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَوْقُوتًا﴾
          </p>
          <p>
            تطبيق «صلاتي» الشامل · سماع الأذان كاملاً في الخلفية، مواقيت دقيقة، بوصلة القبلة، مساجد قريبة، القرآن الكريم والصلاة الإبراهيمية
          </p>
        </div>
      </footer>

      {/* Mobile Fixed Bottom Tab Bar (Thumb Zone) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-stone-900/95 backdrop-blur-md border-t border-stone-800 grid grid-cols-6 items-center h-16 px-1">
        {mobileBottomTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setCurrentTab(tab.id);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`flex flex-col items-center justify-center h-full transition-colors ${
                isActive ? 'text-emerald-400 font-semibold' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] mt-1 tracking-tight truncate max-w-[50px]">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Location & Calculation Method Settings Modal */}
      <CitySelectorModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        currentLocation={location}
        onSelectLocation={(newLoc) => setLocation(newLoc)}
        currentMethod={calculationMethod}
        onSelectMethod={(m) => setCalculationMethod(m)}
        currentJuristic={juristicMethod}
        onSelectJuristic={(j) => setJuristicMethod(j)}
      />

      {/* Adhan Visual Player Modal */}
      <AdhanPlayerModal
        isOpen={isAdhanModalOpen}
        onClose={() => setIsAdhanModalOpen(false)}
        prayerName={activeAdhanPrayerName}
        selectedVoice={selectedVoice}
        onSelectVoice={(v) => setSelectedVoice(v)}
      />
    </div>
  );
}
