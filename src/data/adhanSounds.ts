import { AdhanVoice } from '../types/prayer';

export const ADHAN_VOICES: AdhanVoice[] = [
  {
    id: 'dhuhr_adhan',
    titleArabic: 'أذان صلاة الظهر المبارك',
    reciterArabic: 'أذان ندي خاشع مخصص لوقت الظهر',
    locationArabic: 'الدوحة / الحرمين الشريفين',
    audioUrl: '/audio/adhan/dhuhr.mp3',
    durationText: '3:20',
    isFajrSpecific: false,
  },
  {
    id: 'asr_adhan',
    titleArabic: 'أذان صلاة العصر المبارك',
    reciterArabic: 'أذان ندي خاشع مخصص لوقت العصر',
    locationArabic: 'الدوحة / الحرمين الشريفين',
    audioUrl: '/audio/adhan/asr.mp3',
    durationText: '3:25',
    isFajrSpecific: false,
  },
  {
    id: 'makkah_mulla',
    titleArabic: 'أذان المسجد الحرام (مكة المكرمة)',
    reciterArabic: 'الشيخ علي أحمد ملا (شيخ مؤذني الحرم المكي)',
    locationArabic: 'مكة المكرمة',
    audioUrl: '/audio/adhan/makkah.mp3',
    durationText: '3:45',
    isFajrSpecific: false,
  },
  {
    id: 'madinah_bukhari',
    titleArabic: 'أذان المسجد النبوي الشريف',
    reciterArabic: 'مؤذنو الحرم النبوي الشريف (تسجيل نقي عالي الجودة)',
    locationArabic: 'المدينة المنورة',
    audioUrl: '/audio/adhan/madinah.mp3',
    durationText: '3:30',
    isFajrSpecific: false,
  },
  {
    id: 'alafasy',
    titleArabic: 'أذان الشيخ مشاري راشد العفاسي',
    reciterArabic: 'الشيخ مشاري بن راشد العفاسي (استوديو ستيريو 128kbps)',
    locationArabic: 'دولة الكويت',
    audioUrl: '/audio/adhan/alafasy.mp3',
    durationText: '3:20',
    isFajrSpecific: false,
  },
  {
    id: 'abdulbasit',
    titleArabic: 'أذان الشيخ عبد الباسط عبد الصمد',
    reciterArabic: 'فضيلة الشيخ عبد الباسط عبد الصمد (رحمه الله)',
    locationArabic: 'مصر',
    audioUrl: '/audio/adhan/abdulbasit.mp3',
    durationText: '3:15',
    isFajrSpecific: false,
  },
  {
    id: 'nafees',
    titleArabic: 'أذان الشيخ أحمد النفيس',
    reciterArabic: 'القارئ الشيخ أحمد النفيس (صوت عذب نقي)',
    locationArabic: 'دولة الكويت',
    audioUrl: '/audio/adhan/nafees.mp3',
    durationText: '3:35',
    isFajrSpecific: false,
  },
  {
    id: 'alaqsa',
    titleArabic: 'أذان المسجد الأقصى المبارك',
    reciterArabic: 'مؤذنو المسجد الأقصى المبارك',
    locationArabic: 'القدس الشريف',
    audioUrl: '/audio/adhan/alaqsa.mp3',
    durationText: '3:40',
    isFajrSpecific: false,
  },
  {
    id: 'fajr_alafasy',
    titleArabic: 'أذان الفجر (الصلاة خير من النوم)',
    reciterArabic: 'الشيخ مشاري راشد العفاسي (مخصوص لصلاة الفجر)',
    locationArabic: 'دولة الكويت',
    audioUrl: '/audio/adhan/fajr.mp3',
    durationText: '3:50',
    isFajrSpecific: true,
  },
];


// Dua recited after Adhan
export const DUA_AFTER_ADHAN = {
  hadithTitle: 'فضل دعاء ما بعد الأذان',
  hadithFull: 'مَنْ قَالَ حِينَ يَسْمَعُ النِّدَاءَ: «اللَّهُمَّ رَبَّ هَذِهِ الدَّعْوَةِ التَّامَّةِ، وَالصَّلاَةِ القَائِمَةِ، آتِ مُحَمَّدًا الوَسِيلَةَ وَالفَضِيلَةَ، وَابْعَثْهُ مَقَامًا مَحْمُودًا الَّذِي وَعَدْتَهُ»، حَلَّتْ لَهُ شَفَاعَتِي يَوْمَ القِيَامَةِ.',
  arabic: 'اللَّهُمَّ رَبَّ هَذِهِ الدَّعْوَةِ التَّامَّةِ، وَالصَّلاَةِ القَائِمَةِ، آتِ مُحَمَّدًا الوَسِيلَةَ وَالفَضِيلَةَ، وَابْعَثْهُ مَقَامًا مَحْمُودًا الَّذِي وَعَدْتَهُ',
  salatIbrahimiya: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ، كَمَا صَلَّيْتَ عَلَى إِبْرَاهِيمَ، وَعَلَى آلِ إِبْرَاهِيمَ، إِنَّكَ حَمِيدٌ مَجِيدٌ، اللَّهُمَّ بَارِكْ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ، كَمَا بَارَكْتَ عَلَى إِبْرَاهِيمَ، وَعَلَى آلِ إِبْرَاهِيمَ، إِنَّكَ حَمِيدٌ مَجِيدٌ.',
  reference: 'صحيح البخاري (حديث رقم 614) عن جابر بن عبد الله رضي الله عنهما',
  reward: 'حَلَّتْ لَهُ شَفَاعَتِي يَوْمَ القِيَامَةِ (صحيح البخاري)',
};

// Adhan wording text for visual display during playback
export const ADHAN_WORDS = [
  { text: 'اللهُ أَكْبَرُ، اللهُ أَكْبَرُ', repeat: 2 },
  { text: 'أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا اللهُ', repeat: 2 },
  { text: 'أَشْهَدُ أَنَّ مُحَمَّدًا رَسُولُ اللهِ', repeat: 2 },
  { text: 'حَيَّ عَلَى الصَّلَاةِ', repeat: 2 },
  { text: 'حَيَّ عَلَى الْفَلَاحِ', repeat: 2 },
  { text: 'الصَّلَاةُ خَيْرٌ مِنَ النَّوْمِ (في الفجر)', repeat: 2, fajrOnly: true },
  { text: 'اللهُ أَكْبَرُ، اللهُ أَكْبَرُ', repeat: 1 },
  { text: 'لَا إِلَهَ إِلَّا اللهُ', repeat: 1 },
];
