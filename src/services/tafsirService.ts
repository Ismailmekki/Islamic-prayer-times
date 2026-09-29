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
const singleTafsirCache = new Map<string, string>();
const uthmaniTextCache = new Map<string, string>();
const pageVersesCache = new Map<number, Array<{ verseKey: string; ayahNumber: number; text: string; surahNumber: number }>>();
const surahVersesCache = new Map<number, Array<{ verseKey: string; ayahNumber: number; text: string; surahNumber: number }>>();

export const tafsirService = {
  /**
   * Get all verses for a Surah in Uthmani script
   */
  async getVersesForSurah(surahNumber: number): Promise<Array<{ verseKey: string; ayahNumber: number; text: string; surahNumber: number }>> {
    if (surahVersesCache.has(surahNumber)) {
      return surahVersesCache.get(surahNumber)!;
    }

    try {
      const res = await fetch(`https://api.quran.com/api/v4/quran/verses/uthmani?chapter_number=${surahNumber}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.verses) && data.verses.length > 0) {
          const list = data.verses.map((v: any, index: number) => {
            const [s, a] = (v.verse_key || `${surahNumber}:${index + 1}`).split(':').map((n: string) => parseInt(n, 10));
            return {
              verseKey: v.verse_key || `${surahNumber}:${index + 1}`,
              ayahNumber: a || index + 1,
              surahNumber: s || surahNumber,
              text: v.text_uthmani,
            };
          });
          surahVersesCache.set(surahNumber, list);
          return list;
        }
      }
    } catch (e) {
      console.warn(`Failed fetching verses for surah ${surahNumber}`, e);
    }

    return [];
  },
  /**
   * Get audio URL for a single Ayah (Al-Afasy or Al-Husary)
   */
  getAyahAudioUrl(verseKey: string, reciter: 'Alafasy' | 'Husary' = 'Alafasy'): string {
    const [s, a] = verseKey.split(':').map((n) => parseInt(n, 10));
    const sStr = s.toString().padStart(3, '0');
    const aStr = a.toString().padStart(3, '0');
    const reciterFolder = reciter === 'Husary' ? 'Husary_128kbps' : 'Alafasy_128kbps';
    return `https://everyayah.com/data/${reciterFolder}/${sStr}${aStr}.mp3`;
  },

  /**
   * Get single Ayah Uthmani text
   */
  async getAyahUthmaniText(verseKey: string): Promise<string> {
    if (uthmaniTextCache.has(verseKey)) {
      return uthmaniTextCache.get(verseKey)!;
    }

    try {
      const res = await fetch(`https://api.quran.com/api/v4/quran/verses/uthmani?verse_key=${verseKey}`);
      if (res.ok) {
        const data = await res.json();
        const verse = data.verses?.[0];
        if (verse?.text_uthmani) {
          uthmaniTextCache.set(verseKey, verse.text_uthmani);
          return verse.text_uthmani;
        }
      }
    } catch (e) {
      console.warn(`Failed fetching uthmani text for ${verseKey}`, e);
    }
    return '';
  },

  /**
   * Get single Ayah explanation from specified Tafsir book
   */
  async getAyahTafsir(verseKey: string, tafsirId = 16): Promise<string> {
    const cacheKey = `single_${verseKey}_tafsir_${tafsirId}`;
    if (singleTafsirCache.has(cacheKey)) {
      return singleTafsirCache.get(cacheKey)!;
    }

    try {
      const res = await fetch(`https://api.quran.com/api/v4/tafsirs/${tafsirId}/by_ayah/${verseKey}`);
      if (res.ok) {
        const data = await res.json();
        if (data.tafsir?.text) {
          const clean = sanitizeTafsirHtml(data.tafsir.text);
          singleTafsirCache.set(cacheKey, clean);
          return clean;
        }
      }
    } catch (e) {
      console.warn(`Failed fetching single tafsir for ${verseKey}`, e);
    }

    // Fallback: search in page or surah cache
    const [s] = verseKey.split(':').map((n) => parseInt(n, 10));
    const surahItems = await this.getTafsirForSurah(s, tafsirId);
    const found = surahItems.find((it) => it.verseKey === verseKey);
    if (found && found.text) {
      singleTafsirCache.set(cacheKey, found.text);
      return found.text;
    }

    return 'تفسير الآية متاح عبر اتصال الإنترنت المباشر. يُرجى التحقق من الشبكة وإعادة المحاولة.';
  },

  /**
   * Get all verses on a specific Quran page (1-604) in Uthmani script
   */
  async getVersesForPage(pageNumber: number): Promise<Array<{ verseKey: string; ayahNumber: number; text: string; surahNumber: number }>> {
    if (pageVersesCache.has(pageNumber)) {
      return pageVersesCache.get(pageNumber)!;
    }

    try {
      const res = await fetch(`https://api.quran.com/api/v4/quran/verses/uthmani?page_number=${pageNumber}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.verses) && data.verses.length > 0) {
          const list = data.verses.map((v: any) => {
            const [s, a] = (v.verse_key || '1:1').split(':').map((n: string) => parseInt(n, 10));
            return {
              verseKey: v.verse_key,
              ayahNumber: a,
              surahNumber: s,
              text: v.text_uthmani,
            };
          });
          pageVersesCache.set(pageNumber, list);
          return list;
        }
      }
    } catch (e) {
      console.warn(`Failed fetching verses for page ${pageNumber}`, e);
    }

    return [];
  },

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
