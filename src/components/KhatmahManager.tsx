import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  Sparkles,
  Share2,
  Download,
  Send,
  MessageCircle,
  Copy,
  Check,
  Award,
  BookOpen,
  Heart,
  ChevronDown,
  X,
  FileText,
  PartyPopper,
} from 'lucide-react';
import { Khatmah, KhatmahPart } from '../types/khatmah';
import { khatmahService } from '../services/khatmahService';
import { generateKhatmahCardDataUrl, shareKhatmahCard } from '../utils/khatmahCardGenerator';
import { KhatmahProgressTracker } from './KhatmahProgressTracker';

export const KhatmahManager: React.FC = () => {
  const [khatmahs, setKhatmahs] = useState<Khatmah[]>([]);
  const [activeKhatmahId, setActiveKhatmahId] = useState<string | null>(null);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newIntention, setNewIntention] = useState<string>('');

  // Card Preview & Share Modal
  const [activeCardData, setActiveCardData] = useState<{
    type: 'part' | 'full';
    personName: string;
    partName?: string;
    partNumber?: number;
    khatmahTitle: string;
    intention?: string;
    completedDate?: string;
    totalCompleted?: number;
    totalParts?: number;
  } | null>(null);
  const [generatedCardUrl, setGeneratedCardUrl] = useState<string | null>(null);
  const [isGeneratingCard, setIsGeneratingCard] = useState<boolean>(false);
  const [copyToast, setCopyToast] = useState<string | null>(null);

  // Full Khatmah Dua Modal
  const [showDuaModal, setShowDuaModal] = useState<boolean>(false);

  // Load Khatmahs on mount
  useEffect(() => {
    const list = khatmahService.getKhatmahs();
    setKhatmahs(list);
    const activeId = khatmahService.getActiveKhatmahId();
    if (activeId && list.some((k) => k.id === activeId)) {
      setActiveKhatmahId(activeId);
    } else if (list.length > 0) {
      setActiveKhatmahId(list[0].id);
    }
  }, []);

  const activeKhatmah = khatmahs.find((k) => k.id === activeKhatmahId) || khatmahs[0];

  // Calculate progress
  const completedPartsCount = activeKhatmah
    ? activeKhatmah.parts.filter((p) => p.isCompleted).length
    : 0;
  const progressPercent = activeKhatmah
    ? Math.round((completedPartsCount / 30) * 100)
    : 0;

  // Handle assigning a person's name to a part
  const handleAssignName = (partNumber: number, name: string) => {
    if (!activeKhatmah) return;
    const updated = khatmahService.updatePart(activeKhatmah.id, partNumber, { assignedTo: name });
    if (updated) {
      setKhatmahs((prev) => prev.map((k) => (k.id === updated.id ? updated : k)));
    }
  };

  // Handle toggling part completion
  const handleToggleComplete = async (part: KhatmahPart) => {
    if (!activeKhatmah) return;
    const willBeCompleted = !part.isCompleted;
    const updated = khatmahService.updatePart(activeKhatmah.id, part.partNumber, {
      isCompleted: willBeCompleted,
    });
    if (updated) {
      setKhatmahs((prev) => prev.map((k) => (k.id === updated.id ? updated : k)));

      // If marked completed and has a person's name, immediately show the joyous card modal!
      if (willBeCompleted && part.assignedTo.trim()) {
        openPartCard(part, updated);
      }
    }
  };

  // Handle setting completed parts count directly (0 to 30)
  const handleUpdateCompletedCount = (count: number) => {
    if (!activeKhatmah) return;
    const updated = khatmahService.setCompletedPartsCount(activeKhatmah.id, count);
    if (updated) {
      setKhatmahs((prev) => prev.map((k) => (k.id === updated.id ? updated : k)));
    }
  };

  // Open Celebration Card Modal for a Part
  const openPartCard = async (part: KhatmahPart, currentKhatmah = activeKhatmah) => {
    if (!currentKhatmah) return;
    setIsGeneratingCard(true);
    const data = {
      type: 'part' as const,
      personName: part.assignedTo.trim() || 'قارئ القرآن الكريم',
      partName: part.name,
      partNumber: part.partNumber,
      khatmahTitle: currentKhatmah.title,
      intention: currentKhatmah.intention,
      completedDate: part.completedAt || new Date().toISOString(),
      totalCompleted: currentKhatmah.parts.filter((p) => p.isCompleted).length,
      totalParts: 30,
    };
    setActiveCardData(data);

    try {
      const url = await generateKhatmahCardDataUrl(data);
      setGeneratedCardUrl(url);
    } catch (e) {
      console.error('Error generating card', e);
    } finally {
      setIsGeneratingCard(false);
    }
  };

  // Open Full Khatmah Celebration Card Modal
  const openFullKhatmahCard = async () => {
    if (!activeKhatmah) return;
    setIsGeneratingCard(true);
    // Gather distinct names of readers
    const names = Array.from(
      new Set(activeKhatmah.parts.map((p) => p.assignedTo.trim()).filter(Boolean))
    );
    const namesDisplay = names.length > 0 ? names.slice(0, 5).join(' و ') + (names.length > 5 ? ' وآخرين' : '') : 'أهل القرآن الكرام';

    const data = {
      type: 'full' as const,
      personName: namesDisplay,
      khatmahTitle: activeKhatmah.title,
      intention: activeKhatmah.intention,
      completedDate: activeKhatmah.completedAt || new Date().toISOString(),
      totalCompleted: 30,
      totalParts: 30,
    };
    setActiveCardData(data);

    try {
      const url = await generateKhatmahCardDataUrl(data);
      setGeneratedCardUrl(url);
    } catch (e) {
      console.error('Error generating card', e);
    } finally {
      setIsGeneratingCard(false);
    }
  };

  // Create new Khatmah
  const handleCreateKhatmah = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const created = khatmahService.createKhatmah(newTitle, newIntention);
    const list = khatmahService.getKhatmahs();
    setKhatmahs(list);
    setActiveKhatmahId(created.id);
    setNewTitle('');
    setNewIntention('');
    setIsCreateModalOpen(false);
  };

  // Delete Khatmah
  const handleDeleteKhatmah = (id: string) => {
    if (khatmahs.length <= 1) {
      alert('يجب الإبقاء على ختمة واحدة على الأقل');
      return;
    }
    if (window.confirm('هل أنت متأكد من رغبتك في حذف هذه الختمة؟')) {
      const remaining = khatmahService.deleteKhatmah(id);
      setKhatmahs(remaining);
      if (remaining.length > 0) setActiveKhatmahId(remaining[0].id);
    }
  };

  // Share via WhatsApp
  const shareWhatsApp = () => {
    if (!activeCardData) return;
    const text = `🌸 *مبارك للقارئ الكريم/ة (${activeCardData.personName})* إتمام *${activeCardData.partName || 'الختمة'}* من القرآن الكريم ضمن *(${activeCardData.khatmahTitle})*.\nتقبل الله منكم وجعله نوراً وشفيعاً!\n\n_تم الإنشاء عبر تطبيق صلاتي_ 🕌`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // Share via Telegram
  const shareTelegram = () => {
    if (!activeCardData) return;
    const text = `🌸 مبارك للقارئ الكريم/ة (${activeCardData.personName}) إتمام ${activeCardData.partName || 'الختمة'} من القرآن الكريم ضمن (${activeCardData.khatmahTitle}). تقبل الله منكم!`;
    const url = `https://t.me/share/url?text=${encodeURIComponent(text)}&url=${encodeURIComponent(window.location.href)}`;
    window.open(url, '_blank');
  };

  // Native share / download
  const handleNativeShare = async () => {
    if (!generatedCardUrl || !activeCardData) return;
    await shareKhatmahCard(
      generatedCardUrl,
      activeCardData.personName,
      activeCardData.partName || 'الختمة كاملة',
      activeCardData.khatmahTitle
    );
  };

  // Download directly
  const handleDownload = () => {
    if (!generatedCardUrl || !activeCardData) return;
    const a = document.createElement('a');
    a.href = generatedCardUrl;
    a.download = `شهادة_إتمام_${activeCardData.personName}_${activeCardData.partName || 'الختمة'}.png`;
    a.click();
  };

  // Copy share message
  const copyShareText = () => {
    if (!activeCardData) return;
    const text = `🌸 هنيئاً ومبارك للقارئ الكريم/ة (${activeCardData.personName}) إتمام ${activeCardData.partName || 'الختمة المباركة'} من القرآن الكريم ضمن (${activeCardData.khatmahTitle}). جعلها الله في ميزان حسناتكم ونوراً لكم في الدارين!`;
    navigator.clipboard.writeText(text);
    setCopyToast('تم نسخ نص التهنئة بنجاح!');
    setTimeout(() => setCopyToast(null), 2500);
  };

  if (!activeKhatmah) {
    return null;
  }

  return (
    <div className="space-y-6 text-right">
      {/* Toast */}
      {copyToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-5 py-2 rounded-full text-xs font-bold shadow-xl border border-emerald-400 animate-bounce">
          {copyToast}
        </div>
      )}

      {/* Hero Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-emerald-950 via-stone-900 to-amber-950/80 border border-emerald-500/30 p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
              <Users className="w-4 h-4 text-amber-400" />
              <span>ختمات القرآن الكريم التفاعلية (الفردية والجماعية)</span>
              <span className="bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full text-[10px] border border-amber-500/30">
                مشاركة وبطاقات مبهجة
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white font-quran">
              {activeKhatmah.title}
            </h2>
            {activeKhatmah.intention && (
              <p className="text-xs text-amber-200/90 font-medium">
                النية: {activeKhatmah.intention}
              </p>
            )}
            <p className="text-xs text-stone-300">
              وزّع الأجزاء الثلاثين بإضافة أسماء الأهل والأصدقاء، واحصل على صورة شهادة تهنئة مبهجة وفورية باسم كل شخص لمشاركتها عبر واتساب وتيليجرام ووسائل التواصل!
            </p>
          </div>

          {/* Action buttons on header */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-3.5 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>إنشاء ختمة جديدة</span>
            </button>

            {completedPartsCount === 30 && (
              <button
                onClick={openFullKhatmahCard}
                className="px-3.5 py-2 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-black transition-all shadow-lg flex items-center gap-1.5 cursor-pointer animate-bounce"
              >
                <PartyPopper className="w-4 h-4" />
                <span>🎉 بطاقة إتمام الختمة الكبرى</span>
              </button>
            )}

            <button
              onClick={() => setShowDuaModal(true)}
              className="px-3 py-2 rounded-2xl bg-stone-950/80 hover:bg-stone-800 text-stone-300 text-xs font-bold border border-stone-800 flex items-center gap-1.5 cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-emerald-400" />
              <span>دعاء ختم القرآن</span>
            </button>
          </div>
        </div>

        {/* Khatmahs Selector Tabs */}
        <div className="pt-2 border-t border-emerald-900/40 space-y-3">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            <span className="text-xs text-stone-400 font-semibold shrink-0">الختمات المتاحة:</span>
            {khatmahs.map((k) => (
              <div
                key={k.id}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  k.id === activeKhatmah.id
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-stone-900/80 text-stone-400 hover:text-white border border-stone-800'
                }`}
                onClick={() => {
                  setActiveKhatmahId(k.id);
                  khatmahService.setActiveKhatmahId(k.id);
                }}
              >
                <span>{k.title}</span>
                <span className="text-[10px] bg-black/20 px-1.5 py-0.2 rounded-md font-mono">
                  {k.parts.filter((p) => p.isCompleted).length}/30
                </span>
                {khatmahs.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteKhatmah(k.id);
                    }}
                    className="hover:text-red-300 p-0.5 cursor-pointer"
                    title="حذف الختمة"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dedicated Khatmah Progress Tracker Interface */}
      <KhatmahProgressTracker
        khatmah={activeKhatmah}
        onUpdateCompletedCount={handleUpdateCompletedCount}
        onTogglePart={handleToggleComplete}
        onOpenPartCard={openPartCard}
        onOpenFullKhatmahCard={openFullKhatmahCard}
      />

      {/* Detailed 30 Parts Grid with Names & Cards Header */}
      <div className="flex items-center justify-between pt-2">
        <div className="space-y-0.5">
          <h4 className="text-base font-bold text-white font-quran flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-400" />
            <span>تفاصيل الأجزاء وتخصيص أسماء القراء وبطاقات التهنئة</span>
          </h4>
          <p className="text-xs text-stone-400">
            اكتب اسم القارئ المخصص لكل جزء وشاركه بطاقة التهنئة المبهجة بعد الإتمام
          </p>
        </div>
      </div>

      {/* 30 Parts Grid with Names & Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {activeKhatmah.parts.map((part) => {
          const isDone = part.isCompleted;

          return (
            <div
              key={part.partNumber}
              className={`p-4 rounded-3xl border transition-all duration-300 flex flex-col justify-between gap-3 ${
                isDone
                  ? 'bg-emerald-950/70 border-emerald-500/50 shadow-md shadow-emerald-950/40'
                  : 'bg-stone-900/80 border-stone-800 hover:border-stone-700'
              }`}
            >
              {/* Header: Part Number & Name */}
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-7 h-7 rounded-xl flex items-center justify-center font-mono font-black text-xs ${
                        isDone
                          ? 'bg-emerald-500 text-stone-950 shadow-xs'
                          : 'bg-stone-950 text-amber-400 border border-stone-800'
                      }`}
                    >
                      {part.partNumber}
                    </span>
                    <h4 className="text-sm font-bold text-white font-quran">
                      {part.name}
                    </h4>
                  </div>
                  <p className="text-[11px] text-stone-400">
                    يبدأ من صفحة {part.startPage} · ({part.startSurah})
                  </p>
                </div>

                {/* Status Toggle Button */}
                <button
                  onClick={() => handleToggleComplete(part)}
                  className={`p-2 rounded-2xl transition-all cursor-pointer flex items-center gap-1 text-xs font-bold ${
                    isDone
                      ? 'bg-emerald-500 text-stone-950 shadow-md'
                      : 'bg-stone-950 text-stone-400 hover:text-white border border-stone-800'
                  }`}
                  title={isDone ? 'إلغاء التحديد' : 'تحديد كـ تم الإنجاز'}
                >
                  <CheckCircle2 className="w-4 h-4 fill-current" />
                  <span className="text-[11px]">{isDone ? 'مكتمل' : 'قيد القراءة'}</span>
                </button>
              </div>

              {/* Person's Name Input Field */}
              <div className="space-y-1">
                <label className="text-[11px] text-stone-400 font-semibold block">
                  اسم القارئ / الشخص المخصص له:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="اكتب اسم الشخص هنا (مثال: فاطمة)..."
                    value={part.assignedTo}
                    onChange={(e) => handleAssignName(part.partNumber, e.target.value)}
                    className="w-full bg-stone-950 border border-stone-800 rounded-2xl px-3 py-2 text-xs font-bold text-amber-300 placeholder-stone-600 outline-none focus:border-emerald-500 transition-colors"
                  />
                  {part.assignedTo && (
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs">
                      👤
                    </span>
                  )}
                </div>
              </div>

              {/* Footer: Date & Joyous Card Button */}
              <div className="flex items-center justify-between pt-2 border-t border-stone-800/80 text-xs">
                {isDone && part.completedAt ? (
                  <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>
                      أُنجز:{' '}
                      {new Date(part.completedAt).toLocaleDateString('ar-SA', {
                        month: 'numeric',
                        day: 'numeric',
                      })}
                    </span>
                  </span>
                ) : (
                  <span className="text-[10px] text-stone-500">في انتظار الإتمام</span>
                )}

                {/* Joyous Card Generator Button */}
                <button
                  onClick={() => openPartCard(part)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    isDone
                      ? 'bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-stone-950 border border-amber-500/40 shadow-xs'
                      : 'bg-stone-950 text-stone-400 hover:text-stone-200 border border-stone-800'
                  }`}
                  title="عرض ومشاركة بطاقة التهنئة بالاسم"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>بطاقة الإتمام 🌸</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* Modal 1: Joyous Completion Card Preview & Social Share    */}
      {/* ========================================================= */}
      {activeCardData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-lg bg-stone-900 border border-amber-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 text-right my-8">
            {/* Close Button */}
            <button
              onClick={() => {
                setActiveCardData(null);
                setGeneratedCardUrl(null);
              }}
              className="absolute top-4 left-4 p-2 text-stone-400 hover:text-white rounded-xl bg-stone-800 hover:bg-stone-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Title */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                <PartyPopper className="w-4 h-4" />
                <span>بطاقة التهنئة والإتمام الإسلامية المبهجة</span>
              </div>
              <h3 className="text-lg font-bold text-white font-quran">
                مبارك للقارئ(ة): {activeCardData.personName}
              </h3>
              <p className="text-xs text-stone-300">
                صورة عالية الدقة مخصصة باسم الشخص واسم الجزء، جاهزة للتحميل والمشاركة الفورية عبر وسائل التواصل!
              </p>
            </div>

            {/* Canvas / Image Preview */}
            <div className="relative flex items-center justify-center bg-stone-950 rounded-2xl p-2 border border-stone-800 overflow-hidden shadow-inner">
              {isGeneratingCard || !generatedCardUrl ? (
                <div className="p-16 flex flex-col items-center justify-center gap-3 text-stone-400">
                  <div className="w-10 h-10 border-3 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs font-bold font-quran">
                    جاري رسم البطاقة وتزيينها بالاسم...
                  </span>
                </div>
              ) : (
                <img
                  src={generatedCardUrl}
                  alt={`بطاقة إتمام ${activeCardData.personName}`}
                  className="w-full max-h-[360px] object-contain rounded-xl shadow-lg border border-amber-500/30"
                />
              )}
            </div>

            {/* Share and Download Action Buttons */}
            <div className="space-y-2 pt-2">
              <div className="grid grid-cols-2 gap-2">
                {/* WhatsApp Share Button */}
                <button
                  onClick={shareWhatsApp}
                  className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all active:scale-95"
                >
                  <MessageCircle className="w-4 h-4 fill-white" />
                  <span>إرسال عبر واتساب</span>
                </button>

                {/* Telegram Share Button */}
                <button
                  onClick={shareTelegram}
                  className="px-4 py-2.5 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all active:scale-95"
                >
                  <Send className="w-4 h-4 fill-white" />
                  <span>إرسال عبر تيليجرام</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* Download Button */}
                <button
                  onClick={handleDownload}
                  className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>تحميل الصورة (PNG)</span>
                </button>

                {/* Copy Text Button */}
                <button
                  onClick={copyShareText}
                  className="px-4 py-2.5 rounded-2xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs flex items-center justify-center gap-2 border border-stone-700 cursor-pointer transition-all"
                >
                  <Copy className="w-4 h-4" />
                  <span>نسخ نص التهنئة</span>
                </button>
              </div>

              {/* Native System Share if available */}
              {typeof navigator !== 'undefined' && 'share' in navigator && (
                <button
                  onClick={handleNativeShare}
                  className="w-full py-2.5 rounded-2xl bg-stone-950 hover:bg-stone-800 text-emerald-400 border border-emerald-500/40 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <Share2 className="w-4 h-4" />
                  <span>مشاركة الصورة عبر تطبيقات الهاتف الأخرى</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* Modal 2: Create New Khatmah                                */}
      {/* ========================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-stone-900 border border-stone-800 rounded-3xl p-6 shadow-2xl space-y-4 text-right">
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-4 left-4 p-2 text-stone-400 hover:text-white rounded-xl bg-stone-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white font-quran">إنشاء ختمة قرآنية جديدة</h3>
            <p className="text-xs text-stone-400">
              قم بإنشاء ختمة جديدة لتوزيعها على العائلة أو الأصدقاء أو للمناسبات الطيبة.
            </p>

            <form onSubmit={handleCreateKhatmah} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-stone-300 font-semibold block">عنوان الختمة:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: ختمة العائلة الكريمة / ختمة شهر رمضان"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-2xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-stone-300 font-semibold block">نية الختمة (اختياري):</label>
                <input
                  type="text"
                  placeholder="مثال: لروح الوالدين / شكر وتوفيق / شفاء مريض"
                  value={newIntention}
                  onChange={(e) => setNewIntention(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-2xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer shadow-md transition-all"
              >
                تأكيد وبدء الختمة
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* Modal 3: Dua Khatm Al-Quran (دعاء ختم القرآن الكريم)       */}
      {/* ========================================================= */}
      {showDuaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-stone-900 border border-emerald-500/40 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-4 text-right my-8 max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setShowDuaModal(false)}
              className="absolute top-4 left-4 p-2 text-stone-400 hover:text-white rounded-xl bg-stone-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1 border-b border-stone-800 pb-3">
              <span className="text-xs font-bold text-amber-400">🕌 مبارك ختم القرآن الكريم</span>
              <h3 className="text-xl font-bold text-white font-quran">
                دُعَاءُ خَتْمِ القُرْآنِ الكَرِيمِ الْمُبَارَكُ
              </h3>
            </div>

            <div className="space-y-4 text-stone-200 text-base leading-loose font-quran bg-stone-950/70 p-5 rounded-2xl border border-stone-800">
              <p>
                «اللَّهُمَّ ارْحَمْنِي بالقُرْآنِ، وَاجْعَلهُ لِي إِمَاماً وَنُوراً وَهُدًى وَرَحْمَةً»
              </p>
              <p>
                «اللَّهُمَّ ذَكِّرْنِي مِنْهُ مَا نَسِيتُ، وَعَلِّمْنِي مِنْهُ مَا جَهِلْتُ، وَارْزُقْنِي تِلاَوَتَهُ آنَاءَ اللَّيْلِ وَأَطْرَافَ النَّهَارِ، وَاجْعَلْهُ لِي حُجَّةً يَا رَبَّ العَالَمِينَ»
              </p>
              <p>
                «اللَّهُمَّ أَصْلِحْ لِي دِينِي الَّذِي هُوَ عِصْمَةُ أَمْرِي، وَأَصْلِحْ لِي دُنْيَايَ الَّتِي فِيهَا مَعَاشِي، وَأَصْلِحْ لِي آخِرَتِي الَّتِي فِيهَا مَعَادِي، وَاجْعَلِ الحَيَاةَ زِيَادَةً لِي فِي كُلِّ خَيْرٍ، وَاجْعَلِ المَوْتَ رَاحَةً لِي مِنْ كُلِّ شَرٍّ»
              </p>
              <p>
                «اللَّهُمَّ اجْعَلْ خَيْرَ عُمْرِي آخِرَهُ، وَخَيْرَ عَمَلِي خَوَاتِمَهُ، وَخَيْرَ أَيَّامِي يَوْمَ أَلْقَاكَ فِيهِ»
              </p>
              <p>
                «اللَّهُمَّ تَقَبَّلْ مِنَّا خَتْمَتَنَا هَذِهِ، وَاجْعَلْهَا خَالِصَةً لِوَجْهِكَ الكَرِيمِ، وَانْفَعْنَا وَارْفَعْنَا بِالقُرْآنِ العَظِيمِ، وَصَلِّ اللَّهُمَّ وَسَلِّمْ عَلَى نَبِيِّنَا مُحَمَّدٍ وَعَلَى آلِهِ وَصَحْبِهِ أَجْمَعِينَ»
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    `دُعَاءُ خَتْمِ القُرْآنِ الكَرِيمِ:\n«اللَّهُمَّ ارْحَمْنِي بالقُرْآنِ، وَاجْعَلهُ لِي إِمَاماً وَنُوراً وَهُدًى وَرَحْمَةً... اللَّهُمَّ تَقَبَّلْ مِنَّا خَتْمَتَنَا هَذِهِ وَاجْعَلْهَا خَالِصَةً لِوَجْهِكَ الكَرِيمِ».`
                  );
                  setCopyToast('تم نسخ دعاء ختم القرآن بنجاح!');
                  setTimeout(() => setCopyToast(null), 2500);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>نسخ الدعاء</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
