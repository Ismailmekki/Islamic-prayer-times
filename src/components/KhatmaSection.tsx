import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Share2,
  Copy,
  Check,
  Send,
  Calendar,
  Clock,
  User,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  Search,
  Filter,
  Bell,
  MessageCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Award,
  AlertCircle,
  Edit3,
} from 'lucide-react';
import { Khatma, KhatmaJuz } from '../types/khatma';
import { createInitialJuzList, QURAN_30_JUZ } from '../data/quranJuzData';
import { KhatmaDuaModal } from './KhatmaDuaModal';
import { JuzCompletionCardModal } from './JuzCompletionCardModal';

const STORAGE_KEY = 'salati_quran_khatma_v1';

export const KhatmaSection: React.FC = () => {
  // Load or initialize Khatma state
  const [khatma, setKhatma] = useState<Khatma>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.juzList) && parsed.juzList.length === 30) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading saved khatma', e);
    }

    return {
      id: 'khatma-1',
      title: 'ختمة القرآن الكريم الجماعية المباركة',
      targetDate: 'قبل مغرب يوم الجمعة المباركة',
      notes: 'نسأل الله القبول والإخلاص والشفاعة لجميع المشاركين',
      createdAt: new Date().toISOString(),
      juzList: createInitialJuzList(),
    };
  });

  const [userName, setUserName] = useState<string>(() => {
    return localStorage.getItem('salati_user_default_name') || '';
  });

  // Filter state: 'all' | 'pending' | 'completed' | 'unassigned'
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'unassigned'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [tempTitle, setTempTitle] = useState(khatma.title);
  const [tempDate, setTempDate] = useState(khatma.targetDate);

  const [copiedType, setCopiedType] = useState<'table' | 'reminder' | null>(null);
  const [isDuaModalOpen, setIsDuaModalOpen] = useState(false);
  const [selectedJuzForCard, setSelectedJuzForCard] = useState<KhatmaJuz | null>(null);
  const [notificationStatus, setNotificationStatus] = useState<'default' | 'granted' | 'denied'>('default');

  // Save to localStorage whenever khatma state updates
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(khatma));
  }, [khatma]);

  // Check notification permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationStatus(Notification.permission);
    }
  }, []);

  // Stats calculation
  const completedCount = khatma.juzList.filter((j) => j.isCompleted).length;
  const assignedCount = khatma.juzList.filter((j) => j.assignedTo.trim() !== '').length;
  const progressPercent = Math.round((completedCount / 30) * 100);
  const isAllCompleted = completedCount === 30;

  // Handlers for Juz operations
  const handleAssignName = (juzNumber: number, name: string) => {
    setKhatma((prev) => ({
      ...prev,
      juzList: prev.juzList.map((j) =>
        j.juzNumber === juzNumber ? { ...j, assignedTo: name } : j
      ),
    }));
  };

  const handleClaimJuz = (juzNumber: number) => {
    const claimName = userName.trim() || 'أنا';
    handleAssignName(juzNumber, claimName);
  };

  const handleToggleComplete = (juzNumber: number) => {
    let completedTarget: KhatmaJuz | null = null;
    setKhatma((prev) => {
      const updatedList = prev.juzList.map((j) => {
        if (j.juzNumber === juzNumber) {
          const next = !j.isCompleted;
          const updated = {
            ...j,
            isCompleted: next,
            completedAt: next ? new Date().toISOString() : undefined,
          };
          if (next) {
            completedTarget = updated;
          }
          return updated;
        }
        return j;
      });
      return {
        ...prev,
        juzList: updatedList,
      };
    });

    if (completedTarget) {
      setSelectedJuzForCard(completedTarget);
    }
  };

  const handleSaveInfo = () => {
    setKhatma((prev) => ({
      ...prev,
      title: tempTitle.trim() || 'ختمة القرآن الكريم الجماعية',
      targetDate: tempDate.trim() || 'قبل مغرب يوم الجمعة',
    }));
    setIsEditingInfo(false);
  };

  const handleResetKhatma = () => {
    if (window.confirm('هل تريد بدء ختمة جديدة وإعادة تعيين جميع الأجزاء؟')) {
      setKhatma({
        id: `khatma-${Date.now()}`,
        title: 'ختمة القرآن الكريم الجماعية المباركة',
        targetDate: 'قبل مغرب يوم الجمعة المباركة',
        notes: 'نسأل الله القبول والإخلاص لجميع المشاركين',
        createdAt: new Date().toISOString(),
        juzList: createInitialJuzList(),
      });
    }
  };

  // Generate Table Format matching user's requested template
  const generateTableText = (): string => {
    let text = `🌟 جدول ختمة القرآن الكريم الجماعية 🌟\n`;
    text += `📖 ${khatma.title}\n`;
    text += `نسأل الله القبول والإخلاص. يُرجى من كل مشارك تأكيد القراءة فور الانتهاء.\n\n`;

    khatma.juzList.forEach((j) => {
      const participant = j.assignedTo.trim() || '[اسم المشارك]';
      const statusIcon = j.isCompleted ? ' ✅ (تمت القراءة)' : j.assignedTo.trim() ? ' ⏳ (قيد القراءة)' : ' ⚪ (متاح للحجز)';
      text += `• الجزء (${j.juzNumber}): ${participant}${statusIcon}\n`;
    });

    text += `\n⏰ موعد الإنجاز: [${khatma.targetDate}].\n`;
    text += `📊 نسبة الإنجاز الحالية: ${progressPercent}% (${completedCount} من 30 جزء).\n`;
    text += `🤲 اللهم تقبل منا ومنكم صالح الأعمال.`;

    return text;
  };

  // Generate Reminder Message for pending participants
  const generateReminderText = (): string => {
    const pendingWithNames = khatma.juzList.filter(
      (j) => !j.isCompleted && j.assignedTo.trim() !== ''
    );
    const unassigned = khatma.juzList.filter((j) => j.assignedTo.trim() === '');

    let text = `📢 تذكير طيب بقراءة أجزاء ختمة القرآن الكريم 📢\n`;
    text += `📖 ${khatma.title}\n`;
    text += `⏰ موعد الإنجاز المحدد: [${khatma.targetDate}]\n\n`;

    if (pendingWithNames.length > 0) {
      text += `تذكير رقيق للإخوة والأخوات الكرام بإتمام الأجزاء المحجوزة:\n`;
      pendingWithNames.forEach((j) => {
        text += `• الجزء (${j.juzNumber}): ${j.assignedTo} ⏳\n`;
      });
      text += `\n`;
    }

    if (unassigned.length > 0) {
      text += `✨ أجزاء متبقية متاحة لمن يرغب بالمشاركة ونيل الأجر:\n`;
      text += `الأجزاء: ${unassigned.map((j) => j.juzNumber).join('، ')}\n\n`;
    }

    text += `نسأل الله لكم التيسير والبركة في الأوقات والقبول عند رب الأرض والسماوات 🤲`;
    return text;
  };

  const handleCopyTable = async () => {
    const text = generateTableText();
    try {
      await navigator.clipboard.writeText(text);
      setCopiedType('table');
      setTimeout(() => setCopiedType(null), 3000);
    } catch {}
  };

  const handleCopyReminder = async () => {
    const text = generateReminderText();
    try {
      await navigator.clipboard.writeText(text);
      setCopiedType('reminder');
      setTimeout(() => setCopiedType(null), 3000);
    } catch {}
  };

  const handleShareWhatsApp = (isReminder = false) => {
    const text = isReminder ? generateReminderText() : generateTableText();
    const encoded = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  const handleShareTelegram = (isReminder = false) => {
    const text = isReminder ? generateReminderText() : generateTableText();
    const encoded = encodeURIComponent(text);
    window.open(`https://t.me/share/url?text=${encoded}`, '_blank');
  };

  const requestNotifications = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const perm = await Notification.requestPermission();
      setNotificationStatus(perm);
      if (perm === 'granted') {
        new Notification('تطبيق صلاتي - ختمة القرآن الكريم', {
          body: 'تم تفعيل التنبيهات بنجاح! سنذكرك بموعد إنجاز الختمة والأجزاء المطلوبة.',
          icon: '/apple-touch-icon.png',
        });
      }
    }
  };

  // Filter logic
  const filteredJuzList = khatma.juzList.filter((j) => {
    if (filter === 'pending') return !j.isCompleted && j.assignedTo.trim() !== '';
    if (filter === 'completed') return j.isCompleted;
    if (filter === 'unassigned') return j.assignedTo.trim() === '';
    return true;
  }).filter((j) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      j.juzNumber.toString() === q ||
      j.juzName.toLowerCase().includes(q) ||
      j.assignedTo.toLowerCase().includes(q) ||
      j.surahRange.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Top Banner & Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950/90 via-stone-900 to-stone-900 border border-emerald-500/30 p-5 sm:p-7 shadow-xl">
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>تنظيم ختمة القرآن الكريم وتوزيع الأجزاء</span>
              </span>
              {isAllCompleted && (
                <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold animate-pulse">
                  🎉 اكتملت الختمة بنجاح!
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-emerald-400 shrink-0" />
              <span>{khatma.title}</span>
            </h2>

            <div className="flex items-center gap-4 text-xs sm:text-sm text-stone-300 flex-wrap">
              <div className="flex items-center gap-1.5 bg-stone-950/60 px-3 py-1.5 rounded-xl border border-stone-800">
                <Clock className="w-4 h-4 text-amber-400" />
                <span className="text-stone-400">موعد الإنجاز:</span>
                <strong className="text-white">{khatma.targetDate}</strong>
              </div>

              <button
                onClick={() => {
                  setTempTitle(khatma.title);
                  setTempDate(khatma.targetDate);
                  setIsEditingInfo(!isEditingInfo);
                }}
                className="text-xs text-emerald-400 hover:text-emerald-300 underline flex items-center gap-1 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>تعديل العنوان أو الموعد</span>
              </button>
            </div>
          </div>

          {/* Quick Action buttons in header */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsDuaModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-bold text-xs sm:text-sm shadow-md flex items-center gap-2 cursor-pointer transition active:scale-95"
            >
              <Award className="w-4 h-4 text-stone-950" />
              <span>دعاء ختم القرآن</span>
            </button>

            <button
              onClick={handleResetKhatma}
              className="px-3.5 py-2.5 rounded-xl bg-stone-800/80 hover:bg-stone-800 text-stone-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 border border-stone-700/60 cursor-pointer transition"
              title="بدء ختمة جديدة"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>ختمة جديدة</span>
            </button>
          </div>
        </div>

        {/* Edit Info Form Dropdown */}
        {isEditingInfo && (
          <div className="mt-5 p-4 rounded-2xl bg-stone-950/80 border border-emerald-500/30 space-y-3 animate-in fade-in">
            <h4 className="text-xs font-bold text-emerald-400">تعديل بيانات الختمة:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-stone-400 block mb-1">عنوان الختمة:</label>
                <input
                  type="text"
                  value={tempTitle}
                  onChange={(e) => setTempTitle(e.target.value)}
                  placeholder="مثال: ختمة الجمعة المباركة / ختمة ثواب فلان..."
                  className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-[11px] text-stone-400 block mb-1">موعد الإنجاز المحدد:</label>
                <input
                  type="text"
                  value={tempDate}
                  onChange={(e) => setTempDate(e.target.value)}
                  placeholder="مثال: قبل مغرب يوم الجمعة / 15 رمضان..."
                  className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={() => setIsEditingInfo(false)}
                className="px-3 py-1.5 rounded-lg bg-stone-800 text-stone-300 text-xs cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={handleSaveInfo}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer shadow-xs"
              >
                حفظ التعديلات
              </button>
            </div>
          </div>
        )}

        {/* Visual Progress Bar */}
        <div className="mt-6 pt-5 border-t border-stone-800/80 space-y-2">
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="text-stone-300 font-medium">
              نسبة إنجاز قراءة الـ 30 جزء:
            </span>
            <span className="font-bold text-emerald-400">
              {completedCount} من 30 جزء تم إنجازه ({progressPercent}%)
            </span>
          </div>
          <div className="w-full h-3.5 bg-stone-950 rounded-full overflow-hidden p-0.5 border border-stone-800">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                isAllCompleted
                  ? 'bg-gradient-to-r from-amber-400 via-emerald-400 to-teal-300'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-400'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
            <div className="p-2 rounded-xl bg-stone-950/40 border border-stone-800">
              <span className="text-stone-400 block text-[10px]">الأجزاء المحجوزة</span>
              <strong className="text-white text-sm">{assignedCount} / 30</strong>
            </div>
            <div className="p-2 rounded-xl bg-stone-950/40 border border-stone-800">
              <span className="text-stone-400 block text-[10px]">المكتملة بنجاح</span>
              <strong className="text-emerald-400 text-sm">{completedCount} جزء</strong>
            </div>
            <div className="p-2 rounded-xl bg-stone-950/40 border border-stone-800">
              <span className="text-stone-400 block text-[10px]">المتبقية للإتمام</span>
              <strong className="text-amber-400 text-sm">{30 - completedCount} جزء</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Share & Social Media Distribution Card (The requested feature core) */}
      <div className="rounded-3xl bg-stone-900/90 border border-stone-800 p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800/80 pb-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Share2 className="w-5 h-5 text-emerald-400" />
              <span>إرسال جدول توزيع الأجزاء للمجموعات ومواقع التواصل</span>
            </h3>
            <p className="text-xs text-stone-400 mt-0.5">
              انسخ الجدول المنسق الجاهز بأسماء المشاركين أو أرسله مباشرة إلى مجموعة الواتساب أو التيليجرام
            </p>
          </div>

          {/* Notification Button */}
          {notificationStatus !== 'granted' && (
            <button
              onClick={requestNotifications}
              className="px-3 py-1.5 rounded-xl bg-emerald-950 border border-emerald-600/40 text-emerald-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <Bell className="w-3.5 h-3.5 text-amber-400" />
              <span>تفعيل إشعارات التذكير</span>
            </button>
          )}
        </div>

        {/* Buttons Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Button 1: Copy Main Table */}
          <button
            onClick={handleCopyTable}
            className="px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition shadow-md shadow-emerald-950 active:scale-98"
          >
            {copiedType === 'table' ? (
              <>
                <Check className="w-4 h-4 text-emerald-200" />
                <span>تم نسخ الجدول بنجاح!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>نسخ جدول الأجزاء للمجموعة</span>
              </>
            )}
          </button>

          {/* Button 2: Send directly to WhatsApp */}
          <button
            onClick={() => handleShareWhatsApp(false)}
            className="px-4 py-3 rounded-2xl bg-[#25D366] hover:bg-[#20ba5a] text-stone-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition shadow-md active:scale-98"
          >
            <MessageCircle className="w-4 h-4 text-stone-950" />
            <span>إرسال الجدول في الواتساب</span>
          </button>

          {/* Button 3: Send Reminder to WhatsApp */}
          <button
            onClick={() => handleShareWhatsApp(true)}
            className="px-4 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition shadow-md active:scale-98"
            title="إرسال رسالة تذكير للأجزاء المتبقية فقط"
          >
            <Bell className="w-4 h-4 text-stone-950" />
            <span>تذكير المشاركين بالواتساب</span>
          </button>

          {/* Button 4: Telegram or Copy Reminder */}
          <button
            onClick={() => handleShareTelegram(false)}
            className="px-4 py-3 rounded-2xl bg-[#0088cc] hover:bg-[#0077b5] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition shadow-md active:scale-98"
          >
            <Send className="w-4 h-4" />
            <span>مشاركة عبر تيليجرام</span>
          </button>
        </div>

        {/* Live Preview Box of the Template */}
        <div className="rounded-2xl bg-stone-950/70 border border-stone-800/80 p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-stone-400 border-b border-stone-800 pb-2">
            <span className="font-semibold text-stone-300">معاينة النص الجاهز للإرسال:</span>
            <button
              onClick={handleCopyReminder}
              className="text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
            >
              {copiedType === 'reminder' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              <span>نسخ نص التذكير فقط</span>
            </button>
          </div>
          <pre className="text-xs text-stone-300 font-sans whitespace-pre-wrap leading-relaxed max-h-36 overflow-y-auto pr-1">
            {generateTableText()}
          </pre>
        </div>
      </div>

      {/* 30 Juz Management Section */}
      <div className="space-y-4">
        {/* Controls: Search, Quick User Input & Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-stone-900/80 p-4 rounded-2xl border border-stone-800">
          {/* Quick claim identity name */}
          <div className="flex items-center gap-2 shrink-0">
            <User className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-stone-400">اسمك للحجز السريع:</span>
            <input
              type="text"
              value={userName}
              onChange={(e) => {
                setUserName(e.target.value);
                localStorage.setItem('salati_user_default_name', e.target.value);
              }}
              placeholder="اكتب اسمك هنا..."
              className="bg-stone-950 border border-stone-700 rounded-xl px-2.5 py-1 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-emerald-500 w-32 sm:w-40"
            />
          </div>

          {/* Search Input */}
          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute right-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث برقم الجزء أو اسم المشارك..."
              className="w-full bg-stone-950 border border-stone-700 rounded-xl pr-8 pl-3 py-1.5 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 bg-stone-950 p-1 rounded-xl border border-stone-800 text-xs overflow-x-auto no-scrollbar">
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                filter === 'all'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              الكل (30)
            </button>
            <button
              onClick={() => setFilter('unassigned')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                filter === 'unassigned'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              متاحة للحجز ({khatma.juzList.filter((j) => !j.assignedTo.trim()).length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                filter === 'pending'
                  ? 'bg-amber-600 text-white font-bold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              قيد القراءة ({khatma.juzList.filter((j) => !j.isCompleted && j.assignedTo.trim()).length})
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                filter === 'completed'
                  ? 'bg-emerald-700 text-white font-bold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              المكتملة ({completedCount})
            </button>
          </div>
        </div>

        {/* 30 Juz Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredJuzList.map((juz) => {
            const isAssigned = juz.assignedTo.trim().length > 0;
            return (
              <div
                key={juz.juzNumber}
                className={`relative rounded-2xl p-4 border transition-all ${
                  juz.isCompleted
                    ? 'bg-emerald-950/30 border-emerald-500/40 shadow-sm shadow-emerald-950'
                    : isAssigned
                    ? 'bg-stone-900 border-amber-500/30'
                    : 'bg-stone-900/70 border-stone-800 hover:border-stone-700'
                }`}
              >
                {/* Juz Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                        juz.isCompleted
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : isAssigned
                          ? 'bg-amber-600 text-white'
                          : 'bg-stone-800 text-stone-300'
                      }`}
                    >
                      {juz.juzNumber}
                    </span>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-white leading-tight">
                        الجزء {juz.juzNumber}: {juz.juzName}
                      </h4>
                      <span className="text-[10px] text-stone-400 block font-mono">
                        {juz.surahRange}
                      </span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0 ${
                      juz.isCompleted
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : isAssigned
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-stone-800 text-stone-400'
                    }`}
                  >
                    {juz.isCompleted
                      ? 'تمت القراءة ✅'
                      : isAssigned
                      ? 'قيد القراءة ⏳'
                      : 'متاح للحجز ⚪'}
                  </span>
                </div>

                {/* Participant assignment row */}
                <div className="space-y-2 mt-3 pt-2.5 border-t border-stone-800/80">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={juz.assignedTo}
                      onChange={(e) => handleAssignName(juz.juzNumber, e.target.value)}
                      placeholder="اسم المشارك..."
                      className={`flex-1 bg-stone-950 border rounded-xl px-2.5 py-1.5 text-xs text-white placeholder-stone-500 focus:outline-none ${
                        isAssigned
                          ? 'border-emerald-500/40 text-emerald-300'
                          : 'border-stone-700 focus:border-emerald-500'
                      }`}
                    />

                    {/* Quick claim button if empty */}
                    {!isAssigned && (
                      <button
                        onClick={() => handleClaimJuz(juz.juzNumber)}
                        className="px-2.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-emerald-400 text-xs font-semibold shrink-0 cursor-pointer transition border border-stone-700"
                        title="حجز الجزء باسمي"
                      >
                        حجز لي
                      </button>
                    )}
                  </div>

                  {/* Toggle Complete Button */}
                  <button
                    onClick={() => handleToggleComplete(juz.juzNumber)}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-98 ${
                      juz.isCompleted
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
                        : 'bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white border border-stone-700'
                    }`}
                  >
                    <CheckCircle2
                      className={`w-4 h-4 ${
                        juz.isCompleted ? 'text-white' : 'text-stone-400'
                      }`}
                    />
                    <span>
                      {juz.isCompleted ? 'تمت القراءة بنجاح' : 'تأكيد إتمام القراءة'}
                    </span>
                  </button>

                  {/* Send Completion Card to Group Button (if completed) */}
                  {juz.isCompleted && (
                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      <button
                        onClick={() => {
                          const text = `👤 المُشَارِك الكَرِيم: ${juz.assignedTo.trim() || 'أحد المشاركين'}\n📖 الجُزْء المُنْجَز: الجزء (${juz.juzNumber}) - [${juz.juzName}]`;
                          const encoded = encodeURIComponent(text);
                          window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
                        }}
                        className="py-2 px-2 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-stone-950 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer transition shadow-xs active:scale-95"
                        title="إرسال فوري لقروب الواتساب: اسم المشارك والجزء المنجز"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-stone-950" />
                        <span>إرسال للواتساب</span>
                      </button>

                      <button
                        onClick={() => setSelectedJuzForCard(juz)}
                        className="py-2 px-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-300 font-semibold text-xs flex items-center justify-center gap-1 cursor-pointer transition border border-amber-500/30 active:scale-95"
                        title="فتح بطاقة الإرسال والمشاركة وتعديل الاسم أو حفظ صورة"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>بطاقة الإرسال 🪪</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filteredJuzList.length === 0 && (
          <div className="p-8 text-center rounded-2xl bg-stone-900 border border-stone-800 text-stone-400 text-xs">
            لا توجد أجزاء مطابقة لمعايير البحث الحالية.
          </div>
        )}
      </div>

      {/* Completion Modal for Dua */}
      <KhatmaDuaModal
        isOpen={isDuaModalOpen}
        onClose={() => setIsDuaModalOpen(false)}
        khatmaTitle={khatma.title}
      />

      {/* Juz Completion Card Modal */}
      <JuzCompletionCardModal
        isOpen={!!selectedJuzForCard}
        onClose={() => setSelectedJuzForCard(null)}
        juz={selectedJuzForCard}
        khatmaTitle={khatma.title}
      />
    </div>
  );
};
