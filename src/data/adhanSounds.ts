import { AdhanVoice } from '../types/prayer';

export const ADHAN_VOICES: AdhanVoice[] = [
  {
    id: 'makkah_mulla',
    titleArabic: 'أذان المسجد الحرام (مكة المكرمة)',
    reciterArabic: 'الشيخ علي أحمد ملا (شيخ مؤذني الحرم)',
    locationArabic: 'مكة المكرمة',
    audioUrl: 'https://raw.githubusercontent.com/Kiwifu/adhan-mp3/main/Ali_Ibn_Ahmad_Mala_1_-_Al_Haram_Al_Maki_(%D8%B9%D9%84%D9%8A_%D8%A8%D9%86_%D8%A3%D8%AD%D9%85%D8%AF_%D9%85%D9%84%D8%A7_-_%D8%A7%D9%84%D8%AD%D8%B1%D9%85_%D8%A7%D9%84%D9%85%D9%83%D9%8A).mp3',
    durationText: '3:45',
    isFajrSpecific: false,
  },
  {
    id: 'madinah_bukhari',
    titleArabic: 'أذان المسجد النبوي الشريف',
    reciterArabic: 'مؤذنو الحرم النبوي الشريف',
    locationArabic: 'المدينة المنورة',
    audioUrl: 'https://raw.githubusercontent.com/Kiwifu/adhan-mp3/main/Adhan_Al_Haram_Al_Madani_-_Al_Madinah_1_(%D8%A3%D8%B0%D8%A7%D9%86_%D8%A7%D9%84%D8%AD%D8%B1%D9%85_%D8%A7%D9%84%D9%85%D8%AF%D9%86%D9%8A_-_%D8%A7%D9%84%D9%85%D8%AF%D9%8A%D9%86%D8%A9_%D8%A7%D9%84%D9%85%D9%86%D9%88%D8%B1%D8%A9).mp3',
    durationText: '3:30',
    isFajrSpecific: false,
  },
  {
    id: 'abdulbasit',
    titleArabic: 'أذان الشيخ عبد الباسط عبد الصمد',
    reciterArabic: 'فضيلة الشيخ عبد الباسط عبد الصمد (رحمه الله)',
    locationArabic: 'مصر',
    audioUrl: 'https://raw.githubusercontent.com/Kiwifu/adhan-mp3/main/Abdulbasit_Abdusamad_2_-_Egypt_(%D8%B9%D8%A8%D8%AF_%D8%A7%D9%84%D8%A8%D8%A7%D8%B3%D8%B7_%D8%B9%D8%A8%D8%AF_%D8%A7%D9%84%D8%B5%D9%85%D8%AF_-_%D9%85%D8%B5%D8%B1).mp3',
    durationText: '4:15',
    isFajrSpecific: false,
  },
  {
    id: 'alafasy',
    titleArabic: 'أذان الشيخ مشاري راشد العفاسي',
    reciterArabic: 'الشيخ مشاري راشد العفاسي',
    locationArabic: 'دولة الكويت',
    audioUrl: 'https://raw.githubusercontent.com/Kiwifu/adhan-mp3/main/Mishary_Rashid_Alafasy_1_-_Kuwait_(%D9%85%D8%B4%D8%A7%D8%B1%D9%8A_%D8%B1%D8%A7%D8%B4%D8%AF_%D8%A7%D9%84%D8%B9%D9%81%D8%A7%D8%B3%D9%8A_-_%D8%A7%D9%84%D9%83%D9%88%D9%8A%D8%AA).mp3',
    durationText: '3:20',
    isFajrSpecific: false,
  },
  {
    id: 'fajr_alafasy',
    titleArabic: 'أذان الفجر (الصلاة خير من النوم)',
    reciterArabic: 'الشيخ مشاري بن راشد العفاسي',
    locationArabic: 'دولة الكويت',
    audioUrl: 'https://raw.githubusercontent.com/Kiwifu/adhan-mp3/main/Mishary_Rashid_Alafasy_3_-_Fajr_Kuwait_(%D9%85%D8%B4%D8%A7%D8%B1%D9%8A_%D8%B1%D8%A7%D8%B4%D8%AF_%D8%A7%D9%84%D8%B9%D9%81%D8%A7%D8%B3%D9%8A_-_%D9%81%D8%AC%D8%B1_%D8%A7%D9%84%D9%83%D9%88%D9%8A%D8%AA).mp3',
    durationText: '3:50',
    isFajrSpecific: true,
  },
  {
    id: 'qatami',
    titleArabic: 'أذان الشيخ ناصر القطامي',
    reciterArabic: 'الشيخ ناصر القطامي',
    locationArabic: 'الرياض - السعودية',
    audioUrl: 'https://raw.githubusercontent.com/Kiwifu/adhan-mp3/main/Nasser_Al_Qatami_-_HQ_(%D9%86%D8%A7%D8%B5%D8%B1_%D8%A7%D9%84%D9%82%D8%B7%D8%A7%D9%85%D9%8A).mp3',
    durationText: '3:12',
    isFajrSpecific: false,
  },
  {
    id: 'alaqsa',
    titleArabic: 'أذان المسجد الأقصى المبارك',
    reciterArabic: 'مؤذنو المسجد الأقصى المبارك',
    locationArabic: 'القدس الشريف',
    audioUrl: 'https://raw.githubusercontent.com/Kiwifu/adhan-mp3/main/Adhan_Al_Aqsa_-_Jerusalem_(%D8%A3%D8%B0%D8%A7%D9%86_%D8%A7%D9%84%D9%85%D8%B3%D8%AC%D8%AF_%D8%A7%D9%84%D8%A3%D9%82%D8%B5%D9%89_-_%D8%A7%D9%84%D9%82%D8%AF%D8%B3).mp3',
    durationText: '3:40',
    isFajrSpecific: false,
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
