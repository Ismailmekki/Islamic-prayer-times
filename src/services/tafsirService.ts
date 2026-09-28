/**
 * Tafsir Service for retrieving explanations of Quranic verses & pages
 */

export interface TafsirBook {
  id: number;
  name: string;
  author: string;
  description: string;
}

export const AVAILABLE_TAFSIR_BOOKS: TafsirBook[] = [
  {
    id: 16,
    name: 'التفسير الميسر',
    author: 'مجمع الملك فهد لطباعة المصحف الشريف',
    description: 'تفسير موجز وسهل وواضح يناسب جميع القراء وضعه نخبة من علماء التفسير.',
  },
  {
    id: 91,
    name: 'تفسير السعدي',
    author: 'الشيخ عبد الرحمن السعدي (تيسير الكريم الرحمن)',
    description: 'تفسير بليغ يبرز المعاني الإيمانية والتربوية وجمال مقاصد القرآن.',
  },
  {
    id: 14,
    name: 'تفسير ابن كثير',
    author: 'الحافظ ابن كثير الدمشقي',
    description: 'أشهر كتب التفسير بالمأثور، يفسر القرآن بالقرآن والحديث الشريف.',
  },
  {
    id: 94,
    name: 'تفسير البغوي',
    author: 'الإمام البغوي (معالم التنزيل)',
    description: 'تفسير أثري جليل جامع لعلوم التفسير واللغة دون تطويل.',
  },
];

export interface AyahTafsirItem {
  verseKey: string; // e.g. "1:1"
  surahNumber: number;
  ayahNumber: number;
  text: string;
  verseText?: string;
}

// Memory cache to avoid redundant network calls
const tafsirCache = new Map<string, AyahTafsirItem[]>();

export const tafsirService = {
  async getTafsirForPage(pageNumber: number, tafsirId = 16): Promise<AyahTafsirItem[]> {
    const cacheKey = `page_${pageNumber}_tafsir_${tafsirId}`;
    if (tafsirCache.has(cacheKey)) {
      return tafsirCache.get(cacheKey)!;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6500);

      const res = await fetch(`https://api.quran.com/api/v4/tafsirs/${tafsirId}/by_page/${pageNumber}`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error(`HTTP error ${res.status}`);

      const data = await res.json();
      if (Array.isArray(data.tafsirs) && data.tafsirs.length > 0) {
        const items: AyahTafsirItem[] = data.tafsirs.map((t: any) => {
          const [s, a] = (t.verse_key || '1:1').split(':').map((n: string) => parseInt(n, 10));
          return {
            verseKey: t.verse_key,
            surahNumber: s,
            ayahNumber: a,
            text: sanitizeTafsirHtml(t.text || ''),
          };
        });

        tafsirCache.set(cacheKey, items);
        return items;
      }
    } catch (e) {
      console.warn(`Failed fetching online tafsir for page ${pageNumber}`, e);
    }

    // Fallback message
    return [
      {
        verseKey: `${pageNumber}:1`,
        surahNumber: 1,
        ayahNumber: 1,
        text: `يتطلب عرض التفسير المباشر للصفحة ${pageNumber} اتصالاً نشطاً بالإنترنت. يرجى التحقق من الاتصال وإعادة المحاولة.`,
      },
    ];
  },

  async getTafsirForSurah(surahNumber: number, tafsirId = 16): Promise<AyahTafsirItem[]> {
    const cacheKey = `surah_${surahNumber}_tafsir_${tafsirId}`;
    if (tafsirCache.has(cacheKey)) {
      return tafsirCache.get(cacheKey)!;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(`https://api.quran.com/api/v4/tafsirs/${tafsirId}/by_chapter/${surahNumber}`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error(`HTTP error ${res.status}`);

      const data = await res.json();
      if (Array.isArray(data.tafsirs) && data.tafsirs.length > 0) {
        const items: AyahTafsirItem[] = data.tafsirs.map((t: any) => {
          const [s, a] = (t.verse_key || '1:1').split(':').map((n: string) => parseInt(n, 10));
          return {
            verseKey: t.verse_key,
            surahNumber: s,
            ayahNumber: a,
            text: sanitizeTafsirHtml(t.text || ''),
          };
        });

        tafsirCache.set(cacheKey, items);
        return items;
      }
    } catch (e) {
      console.warn(`Failed fetching online tafsir for surah ${surahNumber}`, e);
    }

    return [];
  },
};

function sanitizeTafsirHtml(html: string): string {
  // Strip harmful tags while keeping simple paragraph and span formatting
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<font[^>]*>/gi, '')
    .replace(/<\/font>/gi, '')
    .trim();
}
