export interface SurahMeta {
  number: number;
  name: string;
  englishName: string;
  englishTranslation: string;
  numberOfAyahs: number;
  revelationType: 'Meccan' | 'Medinan';
}

export interface QuranReciter {
  id: string;
  nameArabic: string;
  baseUrl: string;
  styleArabic: string;
  category?: 'haramain' | 'classic' | 'reverent' | 'general';
}

export const QURAN_RECITERS: QuranReciter[] = [
  { id: 'alafasy', nameArabic: 'الشيخ مشاري راشد العفاسي', baseUrl: 'https://server8.mp3quran.net/afs', styleArabic: 'حفص عن عاصم (مرتل)', category: 'general' },
  { id: 'abdulbasit_murattal', nameArabic: 'الشيخ عبد الباسط عبد الصمد', baseUrl: 'https://server7.mp3quran.net/basit', styleArabic: 'المصحف المرتل', category: 'classic' },
  { id: 'minshawy_murattal', nameArabic: 'الشيخ محمد صديق المنشاوي', baseUrl: 'https://server10.mp3quran.net/minsh', styleArabic: 'المصحف المرتل خاشع', category: 'classic' },
  { id: 'husary', nameArabic: 'الشيخ محمود خليل الحصري', baseUrl: 'https://server13.mp3quran.net/husr', styleArabic: 'رواية حفص بقواعد التجويد', category: 'classic' },
  { id: 'muaiqly', nameArabic: 'الشيخ ماهر المعيقلي', baseUrl: 'https://server12.mp3quran.net/maher', styleArabic: 'إمام المسجد الحرام بمكة', category: 'haramain' },
  { id: 'dosari', nameArabic: 'الشيخ ياسر الدوسري', baseUrl: 'https://server11.mp3quran.net/yasser', styleArabic: 'إمام المسجد الحرام (تلاوة نجدية)', category: 'haramain' },
  { id: 'sds', nameArabic: 'الشيخ عبد الرحمن السديس', baseUrl: 'https://server11.mp3quran.net/sds', styleArabic: 'إمام وخطيب المسجد الحرام', category: 'haramain' },
  { id: 'shur', nameArabic: 'الشيخ سعود الشريم', baseUrl: 'https://server7.mp3quran.net/shur', styleArabic: 'إمام المسجد الحرام سابقاً', category: 'haramain' },
  { id: 'jhn', nameArabic: 'الشيخ عبد الله عواد الجهني', baseUrl: 'https://server13.mp3quran.net/jhn', styleArabic: 'إمام المسجد الحرام', category: 'haramain' },
  { id: 'hthfi', nameArabic: 'الشيخ علي بن عبد الرحمن الحذيفي', baseUrl: 'https://server9.mp3quran.net/hthfi', styleArabic: 'إمام المسجد النبوي الشريف', category: 'haramain' },
  { id: 'ghamadi', nameArabic: 'الشيخ سعد الغامدي', baseUrl: 'https://server7.mp3quran.net/s_gmd', styleArabic: 'صوت هادئ ومؤثر', category: 'reverent' },
  { id: 'shatri', nameArabic: 'الشيخ أبو بكر الشاطري', baseUrl: 'https://server11.mp3quran.net/shatri', styleArabic: 'حدر متقن وخاشع', category: 'reverent' },
  { id: 'ajm', nameArabic: 'الشيخ أحمد بن علي العجمي', baseUrl: 'https://server10.mp3quran.net/ajm', styleArabic: 'تلاوة مهيبة ومؤثرة', category: 'reverent' },
  { id: 'qtm', nameArabic: 'الشيخ ناصر القطامي', baseUrl: 'https://server6.mp3quran.net/qtm', styleArabic: 'نبرة خاشعة ورقيقة', category: 'reverent' },
  { id: 'frs_a', nameArabic: 'الشيخ فارس عباد', baseUrl: 'https://server8.mp3quran.net/frs_a', styleArabic: 'تلاوة يمنية شجية', category: 'reverent' },
  { id: 'abkr', nameArabic: 'الشيخ إدريس أبكر', baseUrl: 'https://server6.mp3quran.net/abkr', styleArabic: 'صوت متبتل وباكٍ', category: 'reverent' },
  { id: 'jleel', nameArabic: 'الشيخ خالد الجليل', baseUrl: 'https://server10.mp3quran.net/jleel', styleArabic: 'تلاوة خاشعة جداً', category: 'reverent' },
  { id: 'lhdan', nameArabic: 'الشيخ محمد اللحيدان', baseUrl: 'https://server8.mp3quran.net/lhdan', styleArabic: 'تلاوة مؤثرة فريدة', category: 'reverent' },
  { id: 'a_jbr', nameArabic: 'الشيخ علي عبد الله جابر (رحمه الله)', baseUrl: 'https://server11.mp3quran.net/a_jbr', styleArabic: 'إمام الحرم المكي الأسبق', category: 'haramain' },
  { id: 'mustafa', nameArabic: 'الشيخ مصطفى إسماعيل', baseUrl: 'https://server8.mp3quran.net/mustafa', styleArabic: 'عملاق التلاوة المصرية', category: 'classic' },
  { id: 'bna', nameArabic: 'الشيخ محمود علي البنا', baseUrl: 'https://server8.mp3quran.net/bna', styleArabic: 'المصحف المرتل المتقن', category: 'classic' },
  { id: 'jbrl', nameArabic: 'الشيخ محمد جبريل', baseUrl: 'https://server8.mp3quran.net/jbrl', styleArabic: 'تلاوة تراويح مشهورة', category: 'general' },
  { id: 'hazza', nameArabic: 'الشيخ هزاع البلوشي', baseUrl: 'https://server11.mp3quran.net/hazza', styleArabic: 'صوت هادئ ومريح للقلب', category: 'reverent' },
  { id: 'bu_khtr', nameArabic: 'الشيخ صلاح بو خاطر', baseUrl: 'https://server8.mp3quran.net/bu_khtr', styleArabic: 'تلاوة إماراتية عذبة', category: 'general' },
];

export function getSurahAudioUrl(surahNumber: number, reciter: QuranReciter): string {
  const padded = surahNumber.toString().padStart(3, '0');
  return `${reciter.baseUrl}/${padded}.mp3`;
}

/**
 * Fetch Surah Ayahs in Uthmani Script with caching
 */
export async function fetchSurahAyahs(surahNumber: number): Promise<SurahContent> {
  // 1. Built-in instant offline cache
  if (OFFLINE_SURAHS[surahNumber]) {
    return OFFLINE_SURAHS[surahNumber];
  }

  // 2. Local storage cache
  const cacheKey = `salati_surah_uthmani_${surahNumber}`;
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch {
    // continue to fetch
  }

  // 3. Online fetch from reliable AlQuran Cloud API
  try {
    const res = await fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/quran-uthmani`);
    if (res.ok) {
      const json = await res.json();
      if (json.code === 200 && json.data) {
        const data = json.data;
        const content: SurahContent = {
          number: data.number,
          name: data.name,
          bismillahPre: data.number !== 1 && data.number !== 9,
          ayahs: (data.ayahs || []).map((a: { numberInSurah: number; text: string }) => {
            let cleanText = a.text;
            if (data.number !== 1 && a.numberInSurah === 1) {
              cleanText = cleanText.replace(/^بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ\s*/, '').trim();
            }
            return {
              numberInSurah: a.numberInSurah,
              text: cleanText,
            };
          }),
        };

        try {
          localStorage.setItem(cacheKey, JSON.stringify(content));
        } catch {
          // quota
        }
        return content;
      }
    }
  } catch (err) {
    console.warn(`Failed to fetch Ayahs for surah ${surahNumber}:`, err);
  }

  // Fallback basic representation if completely offline
  const meta = ALL_SURAHS.find((s) => s.number === surahNumber);
  return {
    number: surahNumber,
    name: meta ? `سُورَةُ ${meta.name}` : `سورة ${surahNumber}`,
    bismillahPre: surahNumber !== 9,
    ayahs: Array.from({ length: meta?.numberOfAyahs || 7 }, (_, i) => ({
      numberInSurah: i + 1,
      text: `آية رقم ${i + 1} من سورة ${meta?.name || ''}`,
    })),
  };
}

export interface RoqyahTrack {
  id: string;
  titleArabic: string;
  reciterArabic: string;
  descriptionArabic: string;
  durationFormatted: string;
  audioUrl: string;
  badgeArabic: string;
}

export const ROQYAH_TRACKS: RoqyahTrack[] = [
  {
    id: 'roqyah_alafasy',
    titleArabic: 'الرقية الشرعية الشاملة الكبرى',
    reciterArabic: 'الشيخ مشاري راشد العفاسي',
    descriptionArabic: 'رقية شرعية جامعة وشاملة للعين والحسد والسحر والمس، وتفريج الهموم وجلب السكينة والشفاء بإذن الله تعالى.',
    durationFormatted: '48:30 دقيقة',
    audioUrl: 'https://download.quranicaudio.com/misc/roqya_alafasy.mp3',
    badgeArabic: 'الأكثر استماعاً',
  },
  {
    id: 'roqyah_ghamadi',
    titleArabic: 'الرقية الشرعية لعلاج العين والحسد والهم',
    reciterArabic: 'الشيخ سعد الغامدي',
    descriptionArabic: 'تلاوة خاشعة لآيات الشفاء والتحصين من القرآن الكريم والأدعية المأثورة عن النبي ﷺ.',
    durationFormatted: '42:15 دقيقة',
    audioUrl: 'https://ia801900.us.archive.org/21/items/RuqyaGhamidi/Ruqya%20Ghamidi.mp3',
    badgeArabic: 'للعين والحسد',
  },
  {
    id: 'roqyah_muaiqly',
    titleArabic: 'الرقية الشرعية لطرد الشياطين وجلب الطمأنينة',
    reciterArabic: 'الشيخ ماهر المعيقلي',
    descriptionArabic: 'رقية قرآنية مباركة بصوت إمام الحرم المكي الشريف لراحة البال وسلامة الصدر والتحصين.',
    durationFormatted: '38:40 دقيقة',
    audioUrl: 'https://ia800302.us.archive.org/1/items/RuqyahMaherAlMuaiqly/Ruqyah%20Maher%20Al%20Muaiqly.mp3',
    badgeArabic: 'سكينة وطمأنينة',
  },
  {
    id: 'roqyah_ajmi',
    titleArabic: 'رقية تحصين البيت والأولاد والبركة',
    reciterArabic: 'الشيخ أحمد بن علي العجمي',
    descriptionArabic: 'رقية شرعية نافعة لتحصين المنازل ودفع وسواس الشياطين وبركة الأرزاق والأولاد.',
    durationFormatted: '35:20 دقيقة',
    audioUrl: 'https://ia800300.us.archive.org/16/items/RuqyahAhmedAlAjmi/Ruqyah%20Ahmed%20Al%20Ajmi.mp3',
    badgeArabic: 'تحصين المنزل',
  },
  {
    id: 'roqyah_abkar',
    titleArabic: 'الرقية الشرعية الخاشعة والمؤثرة',
    reciterArabic: 'الشيخ إدريس أبكر',
    descriptionArabic: 'نبرة بكاء وتضرع خاشعة بالآيات القرآنية وأدعية الاستعاذة بالله من كل سوء ومرض.',
    durationFormatted: '52:10 دقيقة',
    audioUrl: 'https://ia801908.us.archive.org/23/items/RuqyahIdrisAbkar/Ruqyah%20Idris%20Abkar.mp3',
    badgeArabic: 'تلاوة خاشعة',
  },
  {
    id: 'roqyah_healing_verses',
    titleArabic: 'آيات الشفاء والسكينة الست في القرآن الكريم',
    reciterArabic: 'الشيخ عبد الباسط عبد الصمد',
    descriptionArabic: 'الآيات الست الواردة في كتاب الله تعالى الجامعة للشفاء، مع سورة الفاتحة وآية الكرسي والمعوذتين.',
    durationFormatted: '25:00 دقيقة',
    audioUrl: 'https://server7.mp3quran.net/basit/001.mp3',
    badgeArabic: 'آيات الشفاء',
  },
];

export const ALL_SURAHS: SurahMeta[] = [
  { number: 1, name: 'الفاتحة', englishName: 'Al-Faatiha', englishTranslation: 'The Opening', numberOfAyahs: 7, revelationType: 'Meccan' },
  { number: 2, name: 'البقرة', englishName: 'Al-Baqara', englishTranslation: 'The Cow', numberOfAyahs: 286, revelationType: 'Medinan' },
  { number: 3, name: 'آل عمران', englishName: 'Aal-i-Imraan', englishTranslation: 'The Family of Imraan', numberOfAyahs: 200, revelationType: 'Medinan' },
  { number: 4, name: 'النساء', englishName: 'An-Nisaa', englishTranslation: 'The Women', numberOfAyahs: 176, revelationType: 'Medinan' },
  { number: 5, name: 'المائدة', englishName: 'Al-Maaida', englishTranslation: 'The Table', numberOfAyahs: 120, revelationType: 'Medinan' },
  { number: 6, name: 'الأنعام', englishName: 'Al-An\'aam', englishTranslation: 'The Cattle', numberOfAyahs: 165, revelationType: 'Meccan' },
  { number: 7, name: 'الأعراف', englishName: 'Al-A\'raaf', englishTranslation: 'The Heights', numberOfAyahs: 206, revelationType: 'Meccan' },
  { number: 8, name: 'الأنفال', englishName: 'Al-Anfaal', englishTranslation: 'The Spoils of War', numberOfAyahs: 75, revelationType: 'Medinan' },
  { number: 9, name: 'التوبة', englishName: 'At-Tawba', englishTranslation: 'The Repentance', numberOfAyahs: 129, revelationType: 'Medinan' },
  { number: 10, name: 'يونس', englishName: 'Yunus', englishTranslation: 'Jonas', numberOfAyahs: 109, revelationType: 'Meccan' },
  { number: 11, name: 'هود', englishName: 'Hud', englishTranslation: 'Hud', numberOfAyahs: 123, revelationType: 'Meccan' },
  { number: 12, name: 'يوسف', englishName: 'Yusuf', englishTranslation: 'Joseph', numberOfAyahs: 111, revelationType: 'Meccan' },
  { number: 13, name: 'الرعد', englishName: 'Ar-Ra\'d', englishTranslation: 'The Thunder', numberOfAyahs: 43, revelationType: 'Medinan' },
  { number: 14, name: 'إبراهيم', englishName: 'Ibrahim', englishTranslation: 'Abraham', numberOfAyahs: 52, revelationType: 'Meccan' },
  { number: 15, name: 'الحجر', englishName: 'Al-Hijr', englishTranslation: 'The Rock', numberOfAyahs: 99, revelationType: 'Meccan' },
  { number: 16, name: 'النحل', englishName: 'An-Nahl', englishTranslation: 'The Bee', numberOfAyahs: 128, revelationType: 'Meccan' },
  { number: 17, name: 'الإسراء', englishName: 'Al-Israa', englishTranslation: 'The Night Journey', numberOfAyahs: 111, revelationType: 'Meccan' },
  { number: 18, name: 'الكهف', englishName: 'Al-Kahf', englishTranslation: 'The Cave', numberOfAyahs: 110, revelationType: 'Meccan' },
  { number: 19, name: 'مريم', englishName: 'Maryam', englishTranslation: 'Mary', numberOfAyahs: 98, revelationType: 'Meccan' },
  { number: 20, name: 'طه', englishName: 'Taa-Haa', englishTranslation: 'Taa-Haa', numberOfAyahs: 135, revelationType: 'Meccan' },
  { number: 21, name: 'الأنبياء', englishName: 'Al-Anbiyaa', englishTranslation: 'The Prophets', numberOfAyahs: 112, revelationType: 'Meccan' },
  { number: 22, name: 'الحج', englishName: 'Al-Hajj', englishTranslation: 'The Pilgrimage', numberOfAyahs: 78, revelationType: 'Medinan' },
  { number: 23, name: 'المؤمنون', englishName: 'Al-Muminoon', englishTranslation: 'The Believers', numberOfAyahs: 118, revelationType: 'Meccan' },
  { number: 24, name: 'النور', englishName: 'An-Noor', englishTranslation: 'The Light', numberOfAyahs: 64, revelationType: 'Medinan' },
  { number: 25, name: 'الفرقان', englishName: 'Al-Furqaan', englishTranslation: 'The Criterion', numberOfAyahs: 77, revelationType: 'Meccan' },
  { number: 26, name: 'الشعراء', englishName: 'Ash-Shu\'araa', englishTranslation: 'The Poets', numberOfAyahs: 227, revelationType: 'Meccan' },
  { number: 27, name: 'النمل', englishName: 'An-Naml', englishTranslation: 'The Ant', numberOfAyahs: 93, revelationType: 'Meccan' },
  { number: 28, name: 'القصص', englishName: 'Al-Qasas', englishTranslation: 'The Stories', numberOfAyahs: 88, revelationType: 'Meccan' },
  { number: 29, name: 'العنكبوت', englishName: 'Al-Ankaboot', englishTranslation: 'The Spider', numberOfAyahs: 69, revelationType: 'Meccan' },
  { number: 30, name: 'الروم', englishName: 'Ar-Room', englishTranslation: 'The Romans', numberOfAyahs: 60, revelationType: 'Meccan' },
  { number: 31, name: 'لقمان', englishName: 'Luqman', englishTranslation: 'Luqman', numberOfAyahs: 34, revelationType: 'Meccan' },
  { number: 32, name: 'السجدة', englishName: 'As-Sajda', englishTranslation: 'The Prostration', numberOfAyahs: 30, revelationType: 'Meccan' },
  { number: 33, name: 'الأحزاب', englishName: 'Al-Ahzaab', englishTranslation: 'The Clans', numberOfAyahs: 73, revelationType: 'Medinan' },
  { number: 34, name: 'سبأ', englishName: 'Saba', englishTranslation: 'Sheba', numberOfAyahs: 54, revelationType: 'Meccan' },
  { number: 35, name: 'فاطر', englishName: 'Faatir', englishTranslation: 'The Originator', numberOfAyahs: 45, revelationType: 'Meccan' },
  { number: 36, name: 'يس', englishName: 'Yaseen', englishTranslation: 'Yaseen', numberOfAyahs: 83, revelationType: 'Meccan' },
  { number: 37, name: 'الصافات', englishName: 'As-Saaffaat', englishTranslation: 'Those drawn up in ranks', numberOfAyahs: 182, revelationType: 'Meccan' },
  { number: 38, name: 'ص', englishName: 'Saad', englishTranslation: 'The letter Saad', numberOfAyahs: 88, revelationType: 'Meccan' },
  { number: 39, name: 'الزمر', englishName: 'Az-Zumar', englishTranslation: 'The Groups', numberOfAyahs: 75, revelationType: 'Meccan' },
  { number: 40, name: 'غافر', englishName: 'Ghafir', englishTranslation: 'The Forgiver', numberOfAyahs: 85, revelationType: 'Meccan' },
  { number: 41, name: 'فصلت', englishName: 'Fussilat', englishTranslation: 'Explained in detail', numberOfAyahs: 54, revelationType: 'Meccan' },
  { number: 42, name: 'الشورى', englishName: 'Ash-Shura', englishTranslation: 'Consultation', numberOfAyahs: 53, revelationType: 'Meccan' },
  { number: 43, name: 'الزخرف', englishName: 'Az-Zukhruf', englishTranslation: 'Ornaments of gold', numberOfAyahs: 89, revelationType: 'Meccan' },
  { number: 44, name: 'الدخان', englishName: 'Ad-Dukhaan', englishTranslation: 'The Smoke', numberOfAyahs: 59, revelationType: 'Meccan' },
  { number: 45, name: 'الجاثية', englishName: 'Al-Jaathiya', englishTranslation: 'Crouching', numberOfAyahs: 37, revelationType: 'Meccan' },
  { number: 46, name: 'الأحقاف', englishName: 'Al-Ahqaaf', englishTranslation: 'The Dunes', numberOfAyahs: 35, revelationType: 'Meccan' },
  { number: 47, name: 'محمد', englishName: 'Muhammad', englishTranslation: 'Muhammad', numberOfAyahs: 38, revelationType: 'Medinan' },
  { number: 48, name: 'الفتح', englishName: 'Al-Fath', englishTranslation: 'The Victory', numberOfAyahs: 29, revelationType: 'Medinan' },
  { number: 49, name: 'الحجرات', englishName: 'Al-Hujuraat', englishTranslation: 'The Inner Apartments', numberOfAyahs: 18, revelationType: 'Medinan' },
  { number: 50, name: 'ق', englishName: 'Qaaf', englishTranslation: 'The letter Qaaf', numberOfAyahs: 45, revelationType: 'Meccan' },
  { number: 51, name: 'الذاريات', englishName: 'Adh-Dhaariyat', englishTranslation: 'The Winnowing Winds', numberOfAyahs: 60, revelationType: 'Meccan' },
  { number: 52, name: 'الطور', englishName: 'At-Toor', englishTranslation: 'The Mount', numberOfAyahs: 49, revelationType: 'Meccan' },
  { number: 53, name: 'النجم', englishName: 'An-Najm', englishTranslation: 'The Star', numberOfAyahs: 62, revelationType: 'Meccan' },
  { number: 54, name: 'القمر', englishName: 'Al-Qamar', englishTranslation: 'The Moon', numberOfAyahs: 55, revelationType: 'Meccan' },
  { number: 55, name: 'الرحمن', englishName: 'Ar-Rahmaan', englishTranslation: 'The Beneficent', numberOfAyahs: 78, revelationType: 'Medinan' },
  { number: 56, name: 'الواقعة', englishName: 'Al-Waaqia', englishTranslation: 'The Inevitable', numberOfAyahs: 96, revelationType: 'Meccan' },
  { number: 57, name: 'الحديد', englishName: 'Al-Hadid', englishTranslation: 'The Iron', numberOfAyahs: 29, revelationType: 'Medinan' },
  { number: 58, name: 'المجادلة', englishName: 'Al-Mujaadila', englishTranslation: 'The Pleading Woman', numberOfAyahs: 22, revelationType: 'Medinan' },
  { number: 59, name: 'الحشر', englishName: 'Al-Hashr', englishTranslation: 'The Exile', numberOfAyahs: 24, revelationType: 'Medinan' },
  { number: 60, name: 'الممتحنة', englishName: 'Al-Mumtahana', englishTranslation: 'She that is to be examined', numberOfAyahs: 13, revelationType: 'Medinan' },
  { number: 61, name: 'الصف', englishName: 'As-Saff', englishTranslation: 'The Ranks', numberOfAyahs: 14, revelationType: 'Medinan' },
  { number: 62, name: 'الجمعة', englishName: 'Al-Jumu\'a', englishTranslation: 'Friday', numberOfAyahs: 11, revelationType: 'Medinan' },
  { number: 63, name: 'المنافقون', englishName: 'Al-Munaafiqoon', englishTranslation: 'The Hypocrites', numberOfAyahs: 11, revelationType: 'Medinan' },
  { number: 64, name: 'التغابن', englishName: 'At-Taghaabun', englishTranslation: 'Mutual Disillusion', numberOfAyahs: 18, revelationType: 'Medinan' },
  { number: 65, name: 'الطلاق', englishName: 'At-Talaaq', englishTranslation: 'Divorce', numberOfAyahs: 12, revelationType: 'Medinan' },
  { number: 66, name: 'التحريم', englishName: 'At-Tahrim', englishTranslation: 'The Prohibition', numberOfAyahs: 12, revelationType: 'Medinan' },
  { number: 67, name: 'الملك', englishName: 'Al-Mulk', englishTranslation: 'The Sovereignty', numberOfAyahs: 30, revelationType: 'Meccan' },
  { number: 68, name: 'القلم', englishName: 'Al-Qalam', englishTranslation: 'The Pen', numberOfAyahs: 52, revelationType: 'Meccan' },
  { number: 69, name: 'الحاقة', englishName: 'Al-Haaqqa', englishTranslation: 'The Reality', numberOfAyahs: 52, revelationType: 'Meccan' },
  { number: 70, name: 'المعارج', englishName: 'Al-Ma\'aarij', englishTranslation: 'The Ascending Stairways', numberOfAyahs: 44, revelationType: 'Meccan' },
  { number: 71, name: 'نوح', englishName: 'Nooh', englishTranslation: 'Noah', numberOfAyahs: 28, revelationType: 'Meccan' },
  { number: 72, name: 'الجن', englishName: 'Al-Jinn', englishTranslation: 'The Jinn', numberOfAyahs: 28, revelationType: 'Meccan' },
  { number: 73, name: 'المزمل', englishName: 'Al-Muzzammil', englishTranslation: 'The Enshrouded One', numberOfAyahs: 20, revelationType: 'Meccan' },
  { number: 74, name: 'المدثر', englishName: 'Al-Muddathir', englishTranslation: 'The Cloaked One', numberOfAyahs: 56, revelationType: 'Meccan' },
  { number: 75, name: 'القيامة', englishName: 'Al-Qiyaama', englishTranslation: 'The Resurrection', numberOfAyahs: 40, revelationType: 'Meccan' },
  { number: 76, name: 'الإنسان', englishName: 'Al-Insaan', englishTranslation: 'Man', numberOfAyahs: 31, revelationType: 'Medinan' },
  { number: 77, name: 'المرسلات', englishName: 'Al-Mursalaat', englishTranslation: 'The Emissaries', numberOfAyahs: 50, revelationType: 'Meccan' },
  { number: 78, name: 'النبأ', englishName: 'An-Naba', englishTranslation: 'The Tidings', numberOfAyahs: 40, revelationType: 'Meccan' },
  { number: 79, name: 'النازعات', englishName: 'An-Naazi\'aat', englishTranslation: 'Those who drag forth', numberOfAyahs: 46, revelationType: 'Meccan' },
  { number: 80, name: 'عبس', englishName: 'Abasa', englishTranslation: 'He frowned', numberOfAyahs: 42, revelationType: 'Meccan' },
  { number: 81, name: 'التكوير', englishName: 'At-Takweer', englishTranslation: 'The Overthrowing', numberOfAyahs: 29, revelationType: 'Meccan' },
  { number: 82, name: 'الانفطار', englishName: 'Al-Infitaar', englishTranslation: 'The Cleaving', numberOfAyahs: 19, revelationType: 'Meccan' },
  { number: 83, name: 'المطففين', englishName: 'Al-Mutaffifin', englishTranslation: 'Defrauding', numberOfAyahs: 36, revelationType: 'Meccan' },
  { number: 84, name: 'الانشقاق', englishName: 'Al-Inshiqaaq', englishTranslation: 'The Splitting Open', numberOfAyahs: 25, revelationType: 'Meccan' },
  { number: 85, name: 'البروج', englishName: 'Al-Burooj', englishTranslation: 'The Constellations', numberOfAyahs: 22, revelationType: 'Meccan' },
  { number: 86, name: 'الطارق', englishName: 'At-Taariq', englishTranslation: 'The Morning Star', numberOfAyahs: 17, revelationType: 'Meccan' },
  { number: 87, name: 'الأعلى', englishName: 'Al-A\'laa', englishTranslation: 'The Most High', numberOfAyahs: 19, revelationType: 'Meccan' },
  { number: 88, name: 'الغاشية', englishName: 'Al-Ghaashiya', englishTranslation: 'The Overwhelming', numberOfAyahs: 26, revelationType: 'Meccan' },
  { number: 89, name: 'الفجر', englishName: 'Al-Fajr', englishTranslation: 'The Dawn', numberOfAyahs: 30, revelationType: 'Meccan' },
  { number: 90, name: 'البلد', englishName: 'Al-Balad', englishTranslation: 'The City', numberOfAyahs: 20, revelationType: 'Meccan' },
  { number: 91, name: 'الشمس', englishName: 'Ash-Shams', englishTranslation: 'The Sun', numberOfAyahs: 15, revelationType: 'Meccan' },
  { number: 92, name: 'الليل', englishName: 'Al-Lail', englishTranslation: 'The Night', numberOfAyahs: 21, revelationType: 'Meccan' },
  { number: 93, name: 'الضحى', englishName: 'Ad-Dhuhaa', englishTranslation: 'The Morning Hours', numberOfAyahs: 11, revelationType: 'Meccan' },
  { number: 94, name: 'الشرح', englishName: 'Ash-Sharh', englishTranslation: 'The Consolation', numberOfAyahs: 8, revelationType: 'Meccan' },
  { number: 95, name: 'التين', englishName: 'At-Teen', englishTranslation: 'The Fig', numberOfAyahs: 8, revelationType: 'Meccan' },
  { number: 96, name: 'العلق', englishName: 'Al-Alaq', englishTranslation: 'The Clot', numberOfAyahs: 19, revelationType: 'Meccan' },
  { number: 97, name: 'القدر', englishName: 'Al-Qadr', englishTranslation: 'The Power, Fate', numberOfAyahs: 5, revelationType: 'Meccan' },
  { number: 98, name: 'البينة', englishName: 'Al-Bayyina', englishTranslation: 'The Clear Proof', numberOfAyahs: 8, revelationType: 'Medinan' },
  { number: 99, name: 'الزلزلة', englishName: 'Az-Zalzala', englishTranslation: 'The Earthquake', numberOfAyahs: 8, revelationType: 'Medinan' },
  { number: 100, name: 'العاديات', englishName: 'Al-Aadiyaat', englishTranslation: 'The Courser', numberOfAyahs: 11, revelationType: 'Meccan' },
  { number: 101, name: 'القارعة', englishName: 'Al-Qaari\'a', englishTranslation: 'The Calamity', numberOfAyahs: 11, revelationType: 'Meccan' },
  { number: 102, name: 'التكاثر', englishName: 'At-Takaathur', englishTranslation: 'Rivalry in world increase', numberOfAyahs: 8, revelationType: 'Meccan' },
  { number: 103, name: 'العصر', englishName: 'Al-Asr', englishTranslation: 'The Declining Day', numberOfAyahs: 3, revelationType: 'Meccan' },
  { number: 104, name: 'الهمزة', englishName: 'Al-Humaza', englishTranslation: 'The Traducer', numberOfAyahs: 9, revelationType: 'Meccan' },
  { number: 105, name: 'الفيل', englishName: 'Al-Feel', englishTranslation: 'The Elephant', numberOfAyahs: 5, revelationType: 'Meccan' },
  { number: 106, name: 'قريش', englishName: 'Quraish', englishTranslation: 'Quraysh', numberOfAyahs: 4, revelationType: 'Meccan' },
  { number: 107, name: 'الماعون', englishName: 'Al-Maa\'oon', englishTranslation: 'Small Kindness', numberOfAyahs: 7, revelationType: 'Meccan' },
  { number: 108, name: 'الكوثر', englishName: 'Al-Kawthar', englishTranslation: 'Abundance', numberOfAyahs: 3, revelationType: 'Meccan' },
  { number: 109, name: 'الكافرون', englishName: 'Al-Kaafiroon', englishTranslation: 'The Disbelievers', numberOfAyahs: 6, revelationType: 'Meccan' },
  { number: 110, name: 'النصر', englishName: 'An-Nasr', englishTranslation: 'Divine Support', numberOfAyahs: 3, revelationType: 'Medinan' },
  { number: 111, name: 'المسد', englishName: 'Al-Masad', englishTranslation: 'Palm Fibre', numberOfAyahs: 5, revelationType: 'Meccan' },
  { number: 112, name: 'الإخلاص', englishName: 'Al-Ikhlaas', englishTranslation: 'Sincerity', numberOfAyahs: 4, revelationType: 'Meccan' },
  { number: 113, name: 'الفلق', englishName: 'Al-Falaq', englishTranslation: 'The Dawn', numberOfAyahs: 5, revelationType: 'Meccan' },
  { number: 114, name: 'الناس', englishName: 'An-Naas', englishTranslation: 'Mankind', numberOfAyahs: 6, revelationType: 'Meccan' },
];

export interface SurahContent {
  number: number;
  name: string;
  bismillahPre: boolean;
  ayahs: Array<{
    numberInSurah: number;
    text: string;
  }>;
}

// Built-in offline copies of common popular Surahs so it loads instantly even with zero network!
export const OFFLINE_SURAHS: Record<number, SurahContent> = {
  1: {
    number: 1,
    name: 'سُورَةُ الفَاتِحَةِ',
    bismillahPre: false,
    ayahs: [
      { numberInSurah: 1, text: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ' },
      { numberInSurah: 2, text: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ' },
      { numberInSurah: 3, text: 'الرَّحْمَٰنِ الرَّحِيمِ' },
      { numberInSurah: 4, text: 'مَالِكِ يَوْمِ الدِّينِ' },
      { numberInSurah: 5, text: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ' },
      { numberInSurah: 6, text: 'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ' },
      { numberInSurah: 7, text: 'صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ' },
    ],
  },
  112: {
    number: 112,
    name: 'سُورَةُ الإِخْلَاصِ',
    bismillahPre: true,
    ayahs: [
      { numberInSurah: 1, text: 'قُلْ هُوَ اللَّهُ أَحَدٌ' },
      { numberInSurah: 2, text: 'اللَّهُ الصَّمَدُ' },
      { numberInSurah: 3, text: 'لَمْ يَلِدْ وَلَمْ يُولَدْ' },
      { numberInSurah: 4, text: 'وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ' },
    ],
  },
  113: {
    number: 113,
    name: 'سُورَةُ الفَلَقِ',
    bismillahPre: true,
    ayahs: [
      { numberInSurah: 1, text: 'قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ' },
      { numberInSurah: 2, text: 'مِن شَرِّ مَا خَلَقَ' },
      { numberInSurah: 3, text: 'وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ' },
      { numberInSurah: 4, text: 'وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ' },
      { numberInSurah: 5, text: 'وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ' },
    ],
  },
  114: {
    number: 114,
    name: 'سُورَةُ النَّاسِ',
    bismillahPre: true,
    ayahs: [
      { numberInSurah: 1, text: 'قُلْ أَعُوذُ بِرَبِّ النَّاسِ' },
      { numberInSurah: 2, text: 'مَلِكِ النَّاسِ' },
      { numberInSurah: 3, text: 'إِلَٰهِ النَّاسِ' },
      { numberInSurah: 4, text: 'مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ' },
      { numberInSurah: 5, text: 'الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ' },
      { numberInSurah: 6, text: 'مِنَ الْجِنَّةِ وَالنَّاسِ' },
    ],
  },
  67: {
    number: 67,
    name: 'سُورَةُ المُلْكِ',
    bismillahPre: true,
    ayahs: [
      { numberInSurah: 1, text: 'تَبَارَكَ الَّذِي بِيَدِهِ الْمُلْكُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ' },
      { numberInSurah: 2, text: 'الَّذِي خَلَقَ الْمَوْتَ وَالْحَيَاةَ لِيَبْلُوَكُمْ أَيُّكُمْ أَحْسَنُ عَمَلًا ۚ وَهُوَ الْعَزِيزُ الْغَفُورُ' },
      { numberInSurah: 3, text: 'الَّذِي خَلَقَ سَبْعَ سَمَاوَاتٍ طِبَاقًا ۖ مَّا تَرَىٰ فِي خَلْقِ الرَّحْمَٰنِ مِن تَفَاوُتٍ ۖ فَارْجِعِ الْبَصَرَ هَلْ تَرَىٰ مِن فُطُورٍ' },
      { numberInSurah: 4, text: 'ثُمَّ ارْجِعِ الْبَصَرَ كَرَّتَيْنِ يَنقَلِبْ إِلَيْكَ الْبَصَرُ خَاسِئًا وَهُوَ حَسِيرٌ' },
      { numberInSurah: 5, text: 'وَلَقَدْ زَيَّنَّا السَّمَاءَ الدُّنْيَا بِمَصَابِيحَ وَجَعَلْنَاهَا رُجُومًا لِّلشَّيَاطِينِ ۖ وَأَعْتَدْنَا لَهُمْ عَذَابَ السَّعِيرِ' },
    ],
  },
  36: {
    number: 36,
    name: 'سُورَةُ يس',
    bismillahPre: true,
    ayahs: [
      { numberInSurah: 1, text: 'يس' },
      { numberInSurah: 2, text: 'وَالْقُرْآنِ الْحَكِيمِ' },
      { numberInSurah: 3, text: 'إِنَّكَ لَمِنَ الْمُرْسَلِينَ' },
      { numberInSurah: 4, text: 'عَلَىٰ صِرَاطٍ مُّسْتَقِيمٍ' },
      { numberInSurah: 5, text: 'تَنزِيلَ الْعَزِيزِ الرَّحِيمِ' },
      { numberInSurah: 6, text: 'لِتُنذِرَ قَوْمًا مَّا أُنذِرَ آبَاؤُهُمْ فَهُمْ غَافِلُونَ' },
    ],
  },
};
