import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  MessageCircle,
  Send,
  Download,
  Sparkles,
  BookOpen,
  User,
  Heart,
  Calendar,
  Clock,
  Award,
  FileText,
} from 'lucide-react';
import { KhatmaJuz } from '../types/khatma';

interface JuzCompletionCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  juz: KhatmaJuz | null;
  khatmaTitle: string;
}

export const JuzCompletionCardModal: React.FC<JuzCompletionCardModalProps> = ({
  isOpen,
  onClose,
  juz,
  khatmaTitle,
}) => {
  const [copied, setCopied] = useState(false);
  const [customName, setCustomName] = useState<string>('');
  // Mode: 'concise' (default per user request) | 'full'
  const [formatMode, setFormatMode] = useState<'concise' | 'full'>('concise');
  const cardRef = useRef<HTMLDivElement>(null);

  // Sync customName with juz participant name when modal opens
  useEffect(() => {
    if (juz) {
      setCustomName(juz.assignedTo.trim() || 'فاعل خير');
    }
  }, [juz]);

  if (!isOpen || !juz) return null;

  const participantName = customName.trim() || juz.assignedTo.trim() || 'أحد المشاركين الكرام';

  const currentDate = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const currentTime = new Intl.DateTimeFormat('ar', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  }).format(new Date());

  // Formatted Message Text
  const getCardMessageText = (): string => {
    if (formatMode === 'concise') {
      // Exactly the format requested by the user:
      return `👤 المُشَارِك الكَرِيم: ${participantName}
📖 الجُزْء المُنْجَز: الجزء (${juz.juzNumber}) - [${juz.juzName}]`;
    }

    // Full Card Format with Dua
    return `🎉✨ *بِطَاقَةُ إِتْمَامِ قِرَاءَةِ الجُزْءِ مِنَ القُرْآنِ الكَرِيمِ* ✨🎉
━━━━━━━━━━━━━━━━━━━━━━
👤 *المُشَارِك الكَرِيم:* ${participantName}
📖 *الجُزْء المُنْجَز:* الجزء (${juz.juzNumber}) - [${juz.juzName}]
📜 *نِطَاقُ الآيَات:* ${juz.surahRange}
✅ *الحَالَة:* تَمَّتِ القِرَاءَةُ بِحَمْدِ اللَّـهِ وتَوْفِيقِهِ
🕌 *الخَتْمَة:* ${khatmaTitle || 'ختمة القرآن الكريم الجماعية'}
🗓️ *التَّارِيخ:* ${currentDate} (${currentTime})
━━━━━━━━━━━━━━━━━━━━━━
🤲 *الدُّعَاءُ لِلْمُشَارِك:*
«اللَّهُمَّ تَقَبَّلْ مِنْهُ تِلاوَتَهُ، وَاجْعَلِ القُرْآنَ العَظِيمَ رَبِيعَ قَلْبِهِ، وَنُورَ صَدْرِهِ، وَجِلاءَ حُزْنِهِ، وَارْفَعْ بِهِ دَرَجَاتِهِ فِي عِلِّيِّينَ، وَاجْعَلْهُ شَفِيعاً لَهُ وَلِوَالِدَيْهِ يَوْمَ الدِّينِ».
🌟 «اقْرَؤُوا القُرْآنَ فإنَّه يَأْتي يَومَ القِيامَةِ شَفِيعًا لأَصْحابِهِ»`;
  };

  const handleCopy = async () => {
    const text = getCardMessageText();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {}
  };

  const handleWhatsAppShare = () => {
    const text = getCardMessageText();
    const encoded = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  const handleTelegramShare = () => {
    const text = getCardMessageText();
    const encoded = encodeURIComponent(text);
    window.open(`https://t.me/share/url?text=${encoded}`, '_blank');
  };

  const handleNativeShare = async () => {
    const text = getCardMessageText();
    if (navigator.share) {
      try {
        await navigator.share({
          title: `إتمام قراءة الجزء ${juz.juzNumber} - ${participantName}`,
          text: text,
        });
      } catch {}
    } else {
      handleCopy();
    }
  };

  // Generate Image from Canvas
  const handleDownloadImage = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background Gradient (Dark Emerald to Deep Stone)
    const bgGrad = ctx.createLinearGradient(0, 0, 1080, 1080);
    bgGrad.addColorStop(0, '#064e3b');
    bgGrad.addColorStop(0.5, '#042f22');
    bgGrad.addColorStop(1, '#0c0a09');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1080, 1080);

    // Decorative Islamic outer border
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 6;
    ctx.strokeRect(40, 40, 1000, 1000);

    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 2;
    ctx.strokeRect(55, 55, 970, 970);

    // Top Islamic Header
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 36px "Cairo", sans-serif';
    ctx.fillText('بِسْمِ اللَّـهِ الرَّحْمَـٰنِ الرَّحِيمِ', 540, 130);

    // Main Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 44px "Cairo", sans-serif';
    ctx.fillText('إتمام قراءة جزء من القرآن الكريم', 540, 205);

    // Glowing Divider
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(250, 240);
    ctx.lineTo(830, 240);
    ctx.stroke();

    // Participant Name Box
    ctx.fillStyle = '#062d22';
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(100, 280, 880, 180, 24);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#a7f3d0';
    ctx.font = '32px "Cairo", sans-serif';
    ctx.fillText('👤 المُشَارِك الكَرِيم', 540, 340);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 54px "Cairo", sans-serif';
    ctx.fillText(participantName, 540, 415);

    // Juz Details Box
    ctx.fillStyle = '#1c1917';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(100, 500, 880, 220, 24);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 46px "Cairo", sans-serif';
    ctx.fillText(`📖 الجزء (${juz.juzNumber}) - [${juz.juzName}]`, 540, 575);

    ctx.fillStyle = '#9ca3af';
    ctx.font = '30px "Cairo", sans-serif';
    ctx.fillText(`نطاق الآيات: ${juz.surahRange}`, 540, 640);

    // Supplication Line
    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 36px "Cairo", sans-serif';
    ctx.fillText('✅ تَقَبَّلَ اللَّـهُ مِنَّا وَمِنْكُم صَالِحَ الأَعْمَالِ', 540, 780);

    // Footer signature
    ctx.fillStyle = '#6ee7b7';
    ctx.font = '24px "Cairo", sans-serif';
    ctx.fillText('تطبيق صلاتي - ختمة القرآن الكريم الجماعية', 540, 980);

    // Download PNG
    const link = document.createElement('a');
    link.download = `khatma-juz-${juz.juzNumber}-${participantName.replace(/\s+/g, '_')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-3xl bg-stone-900 border border-emerald-500/40 shadow-2xl overflow-hidden flex flex-col text-right max-h-[92vh]">
        {/* Modal Header */}
        <div className="relative p-5 bg-gradient-to-b from-emerald-950 to-stone-900 border-b border-emerald-800/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-700/30 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>إرسال بطاقة إتمام الجزء للقروب</span>
              </h3>
              <p className="text-xs text-stone-300 mt-0.5">
                مشاركة إشعار الإتمام باسم المشارك في قروب الواتساب
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">
          {/* Editable Name Field */}
          <div className="flex items-center gap-2 bg-stone-950 p-2.5 rounded-2xl border border-stone-800">
            <User className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs text-stone-400 shrink-0">اسم المشارك:</span>
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="اكتب اسم المشارك هنا..."
              className="flex-1 bg-stone-900 border border-stone-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Format Mode Selector */}
          <div className="flex items-center gap-2 bg-stone-950 p-1 rounded-xl border border-stone-800 text-xs">
            <button
              onClick={() => setFormatMode('concise')}
              className={`flex-1 py-1.5 px-3 rounded-lg font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                formatMode === 'concise'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <span>المختصر (الاسم والجزء فقط)</span>
            </button>
            <button
              onClick={() => setFormatMode('full')}
              className={`flex-1 py-1.5 px-3 rounded-lg font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                formatMode === 'full'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <span>البطاقة الكاملة مع الدعاء</span>
            </button>
          </div>

          {/* Message Preview Box */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-stone-400">
              <span className="font-semibold text-emerald-400 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" />
                <span>النص الذي سيتم إرساله للقروب:</span>
              </span>
              <span className="text-[10px] text-stone-500 font-mono">جاهز للإرسال</span>
            </div>

            <div
              ref={cardRef}
              className="rounded-2xl p-4 bg-stone-950/90 border-2 border-emerald-500/40 shadow-inner space-y-2 text-right"
            >
              <pre className="text-xs sm:text-sm text-stone-100 font-sans whitespace-pre-wrap leading-relaxed select-all">
                {getCardMessageText()}
              </pre>
            </div>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="p-4 sm:p-5 bg-stone-950 border-t border-stone-800 space-y-2.5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* WhatsApp Send - Primary Big Action */}
            <button
              onClick={handleWhatsAppShare}
              className="py-2.5 px-3 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-stone-950 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition shadow-md active:scale-95"
            >
              <MessageCircle className="w-4 h-4" />
              <span>إرسال للواتساب</span>
            </button>

            {/* Telegram Send */}
            <button
              onClick={handleTelegramShare}
              className="py-2.5 px-3 rounded-xl bg-[#0088cc] hover:bg-[#0077b5] text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition shadow-sm active:scale-95"
            >
              <Send className="w-4 h-4" />
              <span>تيليجرام</span>
            </button>

            {/* Copy Formatted Text */}
            <button
              onClick={handleCopy}
              className="py-2.5 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'تم النسخ!' : 'نسخ النص'}</span>
            </button>

            {/* Download as Image (PNG) */}
            <button
              onClick={handleDownloadImage}
              className="py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition shadow-sm active:scale-95"
              title="تحميل البطاقة كصورة لمشاركتها"
            >
              <Download className="w-4 h-4" />
              <span>حفظ كصورة</span>
            </button>
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              onClick={handleNativeShare}
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>مشاركة عبر تطبيقات أخرى...</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-stone-800 text-stone-300 hover:text-white text-xs cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
