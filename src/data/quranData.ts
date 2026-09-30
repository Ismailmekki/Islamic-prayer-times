export interface SurahMeta {
  number: number;
  name: string;
  englishName: string;
  englishTranslation: string;
  numberOfAyahs: number;
  revelationType: 'Meccan' | 'Medinan';
}

import { ALL_QURAN_RECITERS, QuranReciter } from './allReciters';

export type { QuranReciter };
export const QURAN_RECITERS: QuranReciter[] = ALL_QURAN_RECITERS;

export function getSurahAudioUrl(surahNumber: number, reciter: QuranReciter): string {
  const padded = surahNumber.toString().padStart(3, '0');
  let base = (reciter.baseUrl || 'https://server8.mp3quran.net/afs').trim().replace(/\/+$/, '');
  
  // If base already ends with a 3-digit mp3 filename, remove it to get directory
  if (/\/\d{3}\.mp3$/i.test(base)) {
    base = base.replace(/\/\d{3}\.mp3$/i, '');
  }
  
  return `${base}/${padded}.mp3`;
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
  fallbackAudioUrl?: string;
  alternativeMirrors?: string[];
  fileSizeFormatted?: string;
  badgeArabic: string;
  categoryArabic: string;
}

export const ROQYAH_TRACKS: RoqyahTrack[] = [
  {
    id: 'roqyah_alafasy',
    titleArabic: 'الرقية الشرعية الشاملة الكبرى',
    reciterArabic: 'الشيخ مشاري راشد العفاسي',
    descriptionArabic: 'رقية شرعية جامعة ومطولة شاملة لآيات الشفاء والتحصين ودفع العين والحسد والسحر والمس، وتفريج الهموم وجلب السكينة والشفاء بإذن الله تعالى.',
    durationFormatted: '59:23 دقيقة',
    audioUrl: 'https://archive.org/download/RuqyahAs-shariahBySheikhMisharyRashidAl-afasy/QuranI-podDownloding.mp3',
    fallbackAudioUrl: 'https://archive.org/download/113IsdaaratRoqya/085.mp3',
    alternativeMirrors: [
      'https://archive.org/download/Roquia_Meshary_Al_Afasy_uP_bY_mUSLEm/007-_up_by_muslem.mp3',
      'https://archive.org/download/014-alroqyah-mshary/014-Alroqyah_Mshary.mp3'
    ],
    fileSizeFormatted: '57 ميجابايت',
    badgeArabic: 'الأكثر استماعاً',
    categoryArabic: 'شاملة',
  },
  {
    id: 'roqyah_sudais',
    titleArabic: 'الرقية الشرعية الشاملة مع الدعاء والتحصين',
    reciterArabic: 'الشيخ عبد الرحمن السديس',
    descriptionArabic: 'رقية شرعية خاشعة ومؤثرة لآيات الشفاء والتحصين بنبرة إمام الحرم المكي الشريف، خشوع وبركة وهيبة وسكينة للنفس والبيت.',
    durationFormatted: '30:20 دقيقة',
    audioUrl: 'https://archive.org/download/Roqya_sodais/roqya_sudais.mp3',
    fallbackAudioUrl: 'https://archive.org/download/113IsdaaratRoqya/098.mp3',
    alternativeMirrors: [
      'https://archive.org/download/113IsdaaratRoqya/007.mp3'
    ],
    fileSizeFormatted: '6.5 ميجابايت (سريع جداً)',
    badgeArabic: 'إمام الحرم المكي',
    categoryArabic: 'شاملة',
  },
  {
    id: 'roqyah_ghamadi',
    titleArabic: 'الرقية الشرعية الشاملة لعلاج العين والحسد والهم',
    reciterArabic: 'الشيخ سعد الغامدي',
    descriptionArabic: 'تلاوة خاشعة لآيات الشفاء والتحصين من القرآن الكريم مع آيات السكينة والأدعية النبوية المأثورة للشفاء والوقاية.',
    durationFormatted: '40:15 دقيقة',
    audioUrl: 'https://archive.org/download/014-alroqyah-alqamdy/014-Alroqyah_Alqamdy.mp3',
    fallbackAudioUrl: 'https://archive.org/download/Roquia_Saad_Al_Ghamdi_uP_bY_mUSLEm/009-_up_by_muslem.mp3',
    alternativeMirrors: [
      'https://archive.org/download/113IsdaaratRoqya/012.mp3'
    ],
    fileSizeFormatted: '15 ميجابايت (خفيف وسريع)',
    badgeArabic: 'للعين والحسد',
    categoryArabic: 'للعين والحسد',
  },
  {
    id: 'roqyah_ajmi',
    titleArabic: 'الرقية الشرعية لتحصين البيت والأنفس والبركة',
    reciterArabic: 'الشيخ أحمد بن علي العجمي',
    descriptionArabic: 'رقية شرعية قوية ونافعة لتحصين المنازل ودفع وساوس الشياطين وجلب البركة في الأهل والأولاد والرزق.',
    durationFormatted: '40:48 دقيقة',
    audioUrl: 'https://archive.org/download/Roquia_Ahmad_Al_Ajmi-2_uP_bY_mUSLEm/004--_up_by_muslem.mp3',
    fallbackAudioUrl: 'https://archive.org/download/113IsdaaratRoqya/014.mp3',
    fileSizeFormatted: '54 ميجابايت',
    badgeArabic: 'تحصين المنزل',
    categoryArabic: 'تحصين المنزل',
  },
  {
    id: 'roqyah_muaiqly',
    titleArabic: 'الرقية الشرعية لطرد الشياطين وجلب الطمأنينة',
    reciterArabic: 'الشيخ ماهر المعيقلي',
    descriptionArabic: 'رقية قرآنية مباركة بنبرة إمام الحرم المكي الشريف لراحة البال وسلامة الصدر ودفع الضيق والهم.',
    durationFormatted: '37:34 دقيقة',
    audioUrl: 'https://archive.org/download/20240219_20240219_1349/%D8%A7%D9%84%D8%B1%D9%82%D9%8A%D8%A9%20%D8%A7%D9%84%D8%B4%D8%B1%D8%B9%D9%8A%D8%A9%20%EF%BD%9C%20%D8%A8%D8%B5%D9%88%D8%AA%20%D8%A7%D9%84%D9%82%D8%A7%D8%B1%D9%8A%D9%94%20%D8%A7%D9%84%D8%B4%D9%8A%D8%AE%20%D9%85%D8%A7%D9%87%D8%B1%20%D8%A7%D9%84%D9%85%D8%B9%D9%8A%D9%82%D9%84%D9%8A%20.%20%D8%A8%D8%AF%D9%88%D9%86%20.mp3',
    fallbackAudioUrl: 'https://archive.org/download/113IsdaaratRoqya/049.mp3',
    fileSizeFormatted: '36 ميجابايت',
    badgeArabic: 'سكينة وطمأنينة',
    categoryArabic: 'سكينة وطمأنينة',
  },
  {
    id: 'roqyah_dosari',
    titleArabic: 'الرقية الشرعية الخاشعة من الكتاب والسنة',
    reciterArabic: 'الشيخ ياسر الدوسري',
    descriptionArabic: 'تلاوة نجدية آسرة وخشوع عظيم بالآيات الجامعة للرقية والاستعاذة بالله من كل داء وسقم وهم.',
    durationFormatted: '41:10 دقيقة',
    audioUrl: 'https://archive.org/download/rokya-yasser-dussary/rokya-yasser-dussary.mp3',
    fallbackAudioUrl: 'https://archive.org/download/113IsdaaratRoqya/048.mp3',
    fileSizeFormatted: '50 ميجابايت',
    badgeArabic: 'تلاوة نجدية',
    categoryArabic: 'شاملة',
  },
  {
    id: 'roqyah_abbad',
    titleArabic: 'الرقية الشرعية لعلاج العين والحسد والمس',
    reciterArabic: 'الشيخ فارس عباد',
    descriptionArabic: 'رقية شرعية مؤثرة بصوت شجي لعلاج أعراض العين والمس والسحر وطمأنينة القلب والنفس.',
    durationFormatted: '42:50 دقيقة',
    audioUrl: 'https://archive.org/download/Roquia_Fares_Abbad_uP_bY_mUSLEm/006-_up_by_muslem.mp3',
    fileSizeFormatted: '41 ميجابايت',
    badgeArabic: 'مؤثرة وقوية',
    categoryArabic: 'للعين والحسد',
  },
  {
    id: 'roqyah_qatami',
    titleArabic: 'الرقية الشرعية بنبرة تضرع وسكينة',
    reciterArabic: 'الشيخ ناصر القطامي',
    descriptionArabic: 'تلاوة ندية عذبة بآيات الشفاء الست وسورة الفاتحة وآية الكرسي وخواتيم سورة البقرة والمعوذات.',
    durationFormatted: '30:10 دقيقة',
    audioUrl: 'https://archive.org/download/Nasser_al-Qatami_Roqiyahh/Roqiyah_1.mp3',
    fallbackAudioUrl: 'https://archive.org/download/113IsdaaratRoqya/046.mp3',
    fileSizeFormatted: '18 ميجابايت (سريع)',
    badgeArabic: 'عذبة خاشعة',
    categoryArabic: 'سكينة وطمأنينة',
  },
  {
    id: 'roqyah_abkar',
    titleArabic: 'الرقية الشرعية المطولة الشاملة الكبرى',
    reciterArabic: 'الشيخ إدريس أبكر',
    descriptionArabic: 'التسجيل الكامل والمطول للرقية الشرعية بالتضرع والدعاء والبكاء لشفاء المرضى وتحصين البيوت.',
    durationFormatted: '75:40 دقيقة',
    audioUrl: 'https://archive.org/download/ruqya-idreesabkar.com/ruqya.mp3',
    fileSizeFormatted: '72 ميجابايت',
    badgeArabic: 'الأطول والأشمل',
    categoryArabic: 'مطولة شاملة',
  },
  {
    id: 'roqyah_basit',
    titleArabic: 'الرقية الشرعية المباركة وتلاوة آيات الشفاء',
    reciterArabic: 'الشيخ عبد الباسط عبد الصمد',
    descriptionArabic: 'التلاوة المجودة العذبة لآيات الشفاء والسكينة والتحصين من القرآن الكريم بصوت قيثارة السماء.',
    durationFormatted: '42:30 دقيقة',
    audioUrl: 'https://archive.org/download/Roquia_Abdulbaset_Abdulsamad_uP_bY_mUSLEm/001-_up_by_muslem.mp3',
    fileSizeFormatted: '75 ميجابايت',
    badgeArabic: 'صوت الزمن الجميل',
    categoryArabic: 'آيات الشفاء',
  },
  {
    id: 'roqyah_shuraim',
    titleArabic: 'الرقية الشرعية من رحاب المسجد الحرام',
    reciterArabic: 'الشيخ سعود الشريم',
    descriptionArabic: 'تلاوة آيات الرقية الشرعية والتحصين بنبرة إمام الحرم المكي الشريف، خشوع وهيبة وبركة.',
    durationFormatted: '60:15 دقيقة',
    audioUrl: 'https://archive.org/download/alroqyah-shuraim/Alroqyah-shuraim.mp3',
    fallbackAudioUrl: 'https://archive.org/download/113IsdaaratRoqya/007.mp3',
    fileSizeFormatted: '29 ميجابايت',
    badgeArabic: 'إمام الحرم',
    categoryArabic: 'شاملة',
  },
  {
    id: 'roqyah_qahtani',
    titleArabic: 'الرقية الشرعية الشافية لإبطال السحر والمس',
    reciterArabic: 'الشيخ خالد القحطاني',
    descriptionArabic: 'تلاوة مهيبة ومؤثرة لآيات إبطال السحر وطرد الشياطين وعلاج المس والحسد بنبرة حازمة قوية.',
    durationFormatted: '45:10 دقيقة',
    audioUrl: 'https://archive.org/download/113IsdaaratRoqya/065.mp3',
    fileSizeFormatted: '68 ميجابايت',
    badgeArabic: 'قوية ومؤثرة',
    categoryArabic: 'للعين والحسد',
  },
  {
    id: 'roqyah_refai',
    titleArabic: 'البرهان في علاج السحر والعين ومس الشيطان',
    reciterArabic: 'الشيخ هاني الرفاعي',
    descriptionArabic: 'تلاوة جامعة وتضرع خاشع وبكاء لإبطال السحر ودفع العين والمس والوسواس وجلب الطمأنينة للقلب.',
    durationFormatted: '75:10 دقيقة',
    audioUrl: 'https://archive.org/download/113IsdaaratRoqya/006.mp3',
    fileSizeFormatted: '113 ميجابايت (مطولة)',
    badgeArabic: 'علاج السحر والمس',
    categoryArabic: 'تحصين المنزل',
  },
  {
    id: 'roqyah_minshawi',
    titleArabic: 'الرقية الشرعية بالترتيل الخاشع الحزين',
    reciterArabic: 'الشيخ محمد صديق المنشاوي',
    descriptionArabic: 'ترتيل خاشع مبارك لآيات الرقية والاستشفاء بصوت قيثارة الخشوع الشيخ المنشاوي رحمه الله، هدوء وبركة.',
    durationFormatted: '70:50 دقيقة',
    audioUrl: 'https://archive.org/download/113IsdaaratRoqya/105.mp3',
    fileSizeFormatted: '108 ميجابايت',
    badgeArabic: 'خشوع وترتيل',
    categoryArabic: 'شاملة',
  },
  {
    id: 'roqyah_saigh',
    titleArabic: 'الرقية الشرعية الشاملة للأبدان والأنفس',
    reciterArabic: 'الشيخ توفيق الصائغ',
    descriptionArabic: 'تلاوة مؤثرة لآيات الشفاء الست والأدعية النبوية الجامعة للشفاء والبركة بإذن الله تعالى.',
    durationFormatted: '68:30 دقيقة',
    audioUrl: 'https://archive.org/download/113IsdaaratRoqya/010.mp3',
    fileSizeFormatted: '104 ميجابايت',
    badgeArabic: 'تضرع وسكينة',
    categoryArabic: 'شاملة',
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
