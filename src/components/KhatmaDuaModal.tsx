import React from 'react';
import { X, Sparkles, BookOpen, Heart, Copy, Check } from 'lucide-react';

interface KhatmaDuaModalProps {
  isOpen: boolean;
  onClose: () => void;
  khatmaTitle: string;
}

export const KhatmaDuaModal: React.FC<KhatmaDuaModalProps> = ({
  isOpen,
  onClose,
  khatmaTitle,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const duaText = `اللَّهُمَّ ارْحَمْنِي بالقُرْآنِ وَاجْعَلهُ لِي إِمَاماً وَنُوراً وَهُدًى وَرَحْمَةً،
اللَّهُمَّ ذَكِّرْنِي مِنْهُ مَا نَسِيتُ وَعَلِّمْنِي مِنْهُ مَا جَهِلْتُ وَارْزُقْنِي تِلاَوَتَهُ آنَاءَ اللَّيْلِ وَأَطْرَافَ النَّهَارِ وَاجْعَلْهُ لِي حُجَّةً يَا رَبَّ العَالَمِينَ.
اللَّهُمَّ أَصْلِحْ لِي دِينِي الَّذِي هُوَ عِصْمَةُ أَمْرِي، وَأَصْلِحْ لِي دُنْيَايَ الَّتِي فِيهَا مَعَاشِي، وَأَصْلِحْ لِي آخِرَتِي الَّتِي فِيهَا مَعَادِي، وَاجْعَلِ الحَيَاةَ زِيَادَةً لِي فِي كُلِّ خَيْرٍ وَاجْعَلِ المَوْتَ رَاحَةً لِي مِنْ كُلِّ شَرٍّ.
اللَّهُمَّ اجْعَلْ خَيْرَ عُمْرِي آخِرَهُ وَخَيْرَ عَمَلِي خَوَاتِمَهُ وَخَيْرَ أَيَّامِي يَوْمَ أَلْقَاكَ فِيهِ.
اللَّهُمَّ إِنِّي أَسْأَلُكَ عِيشَةً هَنِيَّةً وَمِيتَةً سَوِيَّةً وَمَرَدّاً غَيْرَ مُخْزٍ وَلاَ فَاضِحٍ.
اللَّهُمَّ إِنِّي أَسْأَلُكَ خَيْرَ المَسْأَلَةِ وَخَيْرَ الدُّعَاءِ وَخَيْرَ النَّجَاحِ وَخَيْرَ العِلْمِ وَخَيْرَ العَمَلِ وَخَيْرَ الثَّوَابِ وَخَيْرَ الحَيَاةِ وَخَيْرَ المَمَاتِ وَثَبِّتْنِي وَثَقِّل مَوَازِينِي وَحَقِّقْ إِيمَانِي وَارْفَعْ دَرَجَتِي وَتَقَبَّلْ صَلاَتِي وَاغْفِرْ خَطِيئَاتِي وَأَسْأَلُكَ العُلَى مِنَ الجَنَّةِ.
اللَّهُمَّ تَقَبَّلْ مِنَّا خَتْمَ كِتَابِكَ الْكَرِيمِ، وَاجْعَلْهُ شَفِيعاً لَنَا وَلِوَالِدَيْنَا وَلِكُلِّ مَنْ شَارَكَ فِي هَذِهِ الْخَتْمَةِ الْمُبَارَكَةِ، وَصَلِّ اللَّهُمَّ وَسَلِّمْ عَلَى سَيِّدِنَا مُحَمَّدٍ وَعَلَى آلِهِ وَصَحْبِهِ أَجْمَعِينَ.`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(duaText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-2xl rounded-3xl bg-stone-900 border border-emerald-500/40 shadow-2xl overflow-hidden flex flex-col text-right max-h-[90vh]">
        {/* Header */}
        <div className="relative p-5 sm:p-6 bg-gradient-to-b from-emerald-950 to-stone-900 border-b border-emerald-800/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-700/30 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>دعاء ختم القرآن الكريم</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  مبارك إتمام الختمة
                </span>
              </h3>
              <p className="text-xs text-stone-300 mt-0.5">
                {khatmaTitle || 'ختمة القرآن الكريم المباركة'}
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

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto font-quran text-base sm:text-lg leading-loose text-stone-200 text-center bg-stone-950/40">
          <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/20 text-emerald-300 text-xs sm:text-sm font-sans mb-3">
            🤲 تقبّل الله منكم ومن جميع المشاركين في هذه الختمة، وجعلها نوراً لكم وشفاعة يوم القيامة.
          </div>

          <p className="whitespace-pre-line">{duaText}</p>
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-950 border-t border-stone-800 flex items-center justify-between gap-3 font-sans">
          <button
            onClick={handleCopy}
            className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold flex items-center gap-2 cursor-pointer transition"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'تم نسخ الدعاء!' : 'نسخ الدعاء للمجموعة'}</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer transition shadow-md"
          >
            تمت القراءة بحمد الله
          </button>
        </div>
      </div>
    </div>
  );
};
