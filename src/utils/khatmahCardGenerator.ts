/**
 * Canvas generator for joyful Islamic completion cards
 * Supports both Part Completion (إتمام الجزء) and Full Khatmah Completion (إتمام الختمة الكبرى)
 */

export interface CardGenerationOptions {
  type: 'part' | 'full';
  personName: string;
  partName?: string;
  partNumber?: number;
  khatmahTitle: string;
  intention?: string;
  completedDate?: string;
  totalCompleted?: number;
  totalParts?: number;
}

export function generateKhatmahCardDataUrl(options: CardGenerationOptions): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    // High-resolution 1200x1200 square card (ideal for WhatsApp, Instagram, Telegram)
    const width = 1200;
    const height = 1200;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      resolve('');
      return;
    }

    // 1. Rich Islamic Gradient Background
    const bgGradient = ctx.createRadialGradient(
      width / 2,
      height / 2,
      100,
      width / 2,
      height / 2,
      width * 0.75
    );
    bgGradient.addColorStop(0, '#064e3b'); // rich deep emerald
    bgGradient.addColorStop(0.5, '#022c22'); // very dark emerald
    bgGradient.addColorStop(1, '#051b14'); // near black
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // 2. Subtle Islamic Geometry / Starburst Overlay
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.strokeStyle = 'rgba(217, 119, 6, 0.08)'; // gold tint
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 24; i++) {
      ctx.rotate((Math.PI * 2) / 24);
      ctx.strokeRect(-350, -350, 700, 700);
    }
    ctx.restore();

    // 3. Elegant Gold Double Border with Islamic Ornaments
    ctx.strokeStyle = '#d97706'; // amber gold
    ctx.lineWidth = 6;
    ctx.strokeRect(50, 50, width - 100, height - 100);

    ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)';
    ctx.lineWidth = 2;
    ctx.strokeRect(65, 65, width - 130, height - 130);

    // Corner decorative diamonds
    const corners = [
      [50, 50],
      [width - 50, 50],
      [50, height - 50],
      [width - 50, height - 50],
    ];
    corners.forEach(([cx, cy]) => {
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(cx, cy, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#064e3b';
      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.fill();
    });

    // 4. Header Badge / Crescent
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Crescent / Bismillah
    ctx.font = 'bold 36px "Amiri", "Traditional Arabic", serif, sans-serif';
    ctx.fillStyle = '#fbbf24'; // light gold
    ctx.fillText('بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', width / 2, 130);

    // Festive Greeting
    ctx.font = 'bold 30px "Tajawal", "Cairo", sans-serif';
    ctx.fillStyle = '#6ee7b7'; // emerald light
    ctx.fillText('✨  هَنِيئاً لَكُمْ تِلَاوَةُ كِتَابِ اللهِ الكَرِيمِ  ✨', width / 2, 195);

    // 5. Main Card Title
    const isFull = options.type === 'full';
    ctx.font = 'bold 64px "Amiri", "Traditional Arabic", serif, sans-serif';
    ctx.fillStyle = '#fef3c7'; // warm cream gold
    const mainTitle = isFull
      ? '🎉 شَهَادَةُ خَتْمِ القُرْآنِ الكَرِيمِ 🎉'
      : '🌸 مُبَارَكٌ إِتْمَامُ الجُزْءِ 🌸';
    ctx.fillText(mainTitle, width / 2, 290);

    // Subtitle ribbon
    ctx.fillStyle = 'rgba(245, 158, 11, 0.15)';
    ctx.fillRect(150, 345, width - 300, 70);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(150, 345, width - 300, 70);

    ctx.font = 'bold 36px "Tajawal", "Cairo", sans-serif';
    ctx.fillStyle = '#fef3c7';
    const sub = isFull
      ? `اكْتَمَلَتْ بِحَمْدِ اللهِ الـ 30 جُزْءاً كَامِلَةً`
      : options.partName || `الجزء ${options.partNumber || ''}`;
    ctx.fillText(sub, width / 2, 380);

    // 6. Person Name Centerpiece Box (Joyous & Grand)
    const personBoxY = 460;
    const boxGradient = ctx.createLinearGradient(0, personBoxY, 0, personBoxY + 220);
    boxGradient.addColorStop(0, 'rgba(16, 185, 129, 0.18)');
    boxGradient.addColorStop(1, 'rgba(6, 78, 59, 0.35)');
    ctx.fillStyle = boxGradient;
    ctx.beginPath();
    if (typeof (ctx as any).roundRect === 'function') {
      (ctx as any).roundRect(120, personBoxY, width - 240, 220, 24);
      ctx.fill();
    } else {
      ctx.fillRect(120, personBoxY, width - 240, 220);
    }
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.6)';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.font = '32px "Tajawal", "Cairo", sans-serif';
    ctx.fillStyle = '#a7f3d0';
    ctx.fillText(isFull ? 'بِمُشَارَكَةِ القَارِئِ الكَرِيمِ:' : 'قَارِئُ الجُزْءِ الْمُبَارَكِ:', width / 2, personBoxY + 55);

    // Large Name in Gold with glow
    ctx.font = 'bold 74px "Amiri", "Traditional Arabic", serif, sans-serif';
    ctx.fillStyle = '#fbbf24';
    ctx.shadowColor = 'rgba(245, 158, 11, 0.6)';
    ctx.shadowBlur = 18;
    ctx.fillText(options.personName || 'أهل القرآن', width / 2, personBoxY + 135);
    ctx.shadowBlur = 0; // reset glow

    // 7. Khatmah Details
    ctx.font = 'bold 32px "Tajawal", "Cairo", sans-serif';
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText(`ضِمْنَ خَتْمَةِ: ${options.khatmahTitle}`, width / 2, 740);

    if (options.intention) {
      ctx.font = '26px "Tajawal", "Cairo", sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`(النِّيَّةُ: ${options.intention})`, width / 2, 790);
    }

    // 8. Blessed Quranic Ayah in Frame
    const ayahBoxY = 850;
    ctx.font = 'italic 28px "Amiri", "Traditional Arabic", serif, sans-serif';
    ctx.fillStyle = '#fde68a';
    ctx.fillText('﴿ إِنَّ الَّذِينَ يَتْلُونَ كِتَابَ اللَّهِ وَأَقَامُوا الصَّلَاةَ... يَرْجُونَ تِجَارَةً لَّن تَبُورَ ﴾', width / 2, ayahBoxY);

    ctx.font = '24px "Tajawal", "Cairo", sans-serif';
    ctx.fillStyle = '#6ee7b7';
    ctx.fillText('جَعَلَهُ اللهُ نُوراً فِي قَلْبِكَ وَشَفِيعاً لَكَ يَوْمَ القِيَامَةِ', width / 2, ayahBoxY + 55);

    // 9. Footer with Date & App Name
    ctx.strokeStyle = 'rgba(217, 119, 6, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(200, 960);
    ctx.lineTo(width - 200, 960);
    ctx.stroke();

    const dateStr = options.completedDate
      ? new Date(options.completedDate).toLocaleDateString('ar-SA', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : new Date().toLocaleDateString('ar-SA', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });

    ctx.font = 'bold 24px "Tajawal", "Cairo", sans-serif';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(`تَارِيخُ الإِتْمَامِ: ${dateStr}`, width / 2, 1010);

    if (options.totalCompleted && options.totalParts) {
      ctx.font = '22px "Tajawal", "Cairo", sans-serif';
      ctx.fillStyle = '#fbbf24';
      ctx.fillText(`إِنْجَازُ الخَتْمَةِ: ${options.totalCompleted} مِنْ ${options.totalParts} جُزْءاً مُكْتَمِلاً`, width / 2, 1050);
    }

    ctx.font = 'bold 22px "Tajawal", "Cairo", sans-serif';
    ctx.fillStyle = '#10b981';
    ctx.fillText('تَطْبِيقُ صَلَاتِي الشَّامِلُ  ·  SALATI APP', width / 2, 1110);

    resolve(canvas.toDataURL('image/png'));
  });
}

/**
 * Helper to share or download the card
 */
export async function shareKhatmahCard(
  cardDataUrl: string,
  personName: string,
  partName: string,
  khatmahTitle: string
): Promise<{ success: boolean; method: string }> {
  const shareText = `🌸 مبارك للقارئ الكريم/ة (${personName}) إتمام ${partName} من القرآن الكريم ضمن (${khatmahTitle}). تقبل الله منكم وجعله نوراً وشفيعاً!`;

  // Convert dataURL to Blob for Native Sharing if supported
  try {
    if (navigator.share && navigator.canShare) {
      const res = await fetch(cardDataUrl);
      const blob = await res.blob();
      const file = new File([blob], `khatmah_${personName}_part.png`, { type: 'image/png' });

      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `إتمام جزء من القرآن الكريم - ${personName}`,
          text: shareText,
          files: [file],
        });
        return { success: true, method: 'native_share_with_file' };
      }
    }
  } catch (e) {
    console.warn('Native file share failed or dismissed', e);
  }

  // Fallback 1: Text share via native share
  if (navigator.share) {
    try {
      await navigator.share({
        title: `إتمام جزء من القرآن الكريم - ${personName}`,
        text: shareText,
      });
      return { success: true, method: 'native_text_share' };
    } catch {}
  }

  // Fallback 2: Direct file download
  const link = document.createElement('a');
  link.download = `شهادة_إتمام_${personName}_${partName}.png`;
  link.href = cardDataUrl;
  link.click();
  return { success: true, method: 'download' };
}
