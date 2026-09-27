import { KhatmaJuz } from '../types/khatma';

export interface JuzMetadata {
  juzNumber: number;
  juzName: string;
  startAyah: string;
  surahRange: string;
}

export const QURAN_30_JUZ: JuzMetadata[] = [
  {
    juzNumber: 1,
    juzName: 'الم (الفاتحة والبقرة)',
    startAyah: 'بِسْمِ اللَّـهِ الرَّحْمَـٰنِ الرَّحِيمِ',
    surahRange: 'الفاتحة 1 - البقرة 141',
  },
  {
    juzNumber: 2,
    juzName: 'سيقول السفهاء',
    startAyah: 'سَيَقُولُ السُّفَهَاءُ مِنَ النَّاسِ',
    surahRange: 'البقرة 142 - البقرة 252',
  },
  {
    juzNumber: 3,
    juzName: 'تلك الرسل',
    startAyah: 'تِلْكَ الرُّسُلُ فَضَّلْنَا بَعْضَهُمْ عَلَىٰ بَعْضٍ',
    surahRange: 'البقرة 253 - آل عمران 92',
  },
  {
    juzNumber: 4,
    juzName: 'لن تنالوا البر',
    startAyah: 'لَن تَنَالُوا الْبِرَّ حَتَّىٰ تُنفِقُوا مِمَّا تُحِبُّونَ',
    surahRange: 'آل عمران 93 - النساء 23',
  },
  {
    juzNumber: 5,
    juzName: 'والمحصنات',
    startAyah: 'وَالْمُحْصَنَاتُ مِنَ النِّسَاءِ إِلَّا مَا مَلَكَتْ أَيْمَانُكُمْ',
    surahRange: 'النساء 24 - النساء 147',
  },
  {
    juzNumber: 6,
    juzName: 'لا يحب الله',
    startAyah: 'لَّا يُحِبُّ اللَّـهُ الْجَهْرَ بِالسُّوءِ مِنَ الْقَوْلِ',
    surahRange: 'النساء 148 - المائدة 81',
  },
  {
    juzNumber: 7,
    juzName: 'وإذا سمعوا',
    startAyah: 'وَإِذَا سَمِعُوا مَا أُنزِلَ إِلَى الرَّسُولِ',
    surahRange: 'المائدة 82 - الأنعام 110',
  },
  {
    juzNumber: 8,
    juzName: 'ولو أننا نزلنا',
    startAyah: 'وَلَوْ أَنَّنَا نَزَّلْنَا إِلَيْهِمُ الْمَلَائِكَةَ',
    surahRange: 'الأنعام 111 - الأعراف 87',
  },
  {
    juzNumber: 9,
    juzName: 'قال الملأ',
    startAyah: 'قَالَ الْمَلَأُ الَّذِينَ اسْتَكْبَرُوا مِن قَوْمِهِ',
    surahRange: 'الأعراف 88 - الأنفال 40',
  },
  {
    juzNumber: 10,
    juzName: 'واعلموا أنما غنمتم',
    startAyah: 'وَاعْلَمُوا أَنَّمَا غَنِمْتُم مِّن شَيْءٍ',
    surahRange: 'الأنفال 41 - التوبة 92',
  },
  {
    juzNumber: 11,
    juzName: 'يعتذرون إليكم',
    startAyah: 'يَعْتَذِرُونَ إِلَيْكُمْ إِذَا رَجَعْتُمْ إِلَيْهِمْ',
    surahRange: 'التوبة 93 - هود 5',
  },
  {
    juzNumber: 12,
    juzName: 'وما من دابة',
    startAyah: 'وَمَا مِن دَابَّةٍ فِي الْأَرْضِ إِلَّا عَلَى اللَّـهِ رِزْقُهَا',
    surahRange: 'هود 6 - يوسف 52',
  },
  {
    juzNumber: 13,
    juzName: 'وما أبرئ نفسي',
    startAyah: 'وَمَا أُبَرِّئُ نَفْسِي إِنَّ النَّفْسَ لَأَمَّارَةٌ بِالسُّوءِ',
    surahRange: 'يوسف 53 - إبراهيم 52',
  },
  {
    juzNumber: 14,
    juzName: 'ربما يود',
    startAyah: 'رُّبَمَا يَوَدُّ الَّذِينَ كَفَرُوا لَوْ كَانُوا مُسْلِمِينَ',
    surahRange: 'الحجر 1 - النحل 128',
  },
  {
    juzNumber: 15,
    juzName: 'سبحان الذي أسرى',
    startAyah: 'سُبْحَانَ الَّذِي أَسْرَىٰ بِعَبْدِهِ لَيْلًا',
    surahRange: 'الإسراء 1 - الكهف 74',
  },
  {
    juzNumber: 16,
    juzName: 'قال ألم أقل لك',
    startAyah: 'قَالَ أَلَمْ أَقُل لَّكَ إِنَّكَ لَن تَسْتَطِيعَ مَعِيَ صَبْرًا',
    surahRange: 'الكهف 75 - طه 135',
  },
  {
    juzNumber: 17,
    juzName: 'اقترب للناس',
    startAyah: 'اقْتَرَبَ لِلنَّاسِ حِسَابُهُمْ وَهُمْ فِي غَفْلَةٍ مَّعْرِضُونَ',
    surahRange: 'الأنبياء 1 - الحج 78',
  },
  {
    juzNumber: 18,
    juzName: 'قد أفلح المؤمنون',
    startAyah: 'قَدْ أَفْلَحَ الْمُؤْمِنُونَ * الَّذِينَ هُمْ فِي صَلَاتِهِمْ خَاشِعُونَ',
    surahRange: 'المؤمنون 1 - الفرقان 20',
  },
  {
    juzNumber: 19,
    juzName: 'وقال الذين لا يرجون',
    startAyah: 'وَقَالَ الَّذِينَ لَا يَرْجُونَ لِقَاءَنَا لَوْلَا أُنزِلَ عَلَيْنَا الْمَلَائِكَةُ',
    surahRange: 'الفرقان 21 - النمل 55',
  },
  {
    juzNumber: 20,
    juzName: 'أمن خلق السماوات',
    startAyah: 'أَمَّنْ خَلَقَ السَّمَاوَاتِ وَالْأَرْضَ',
    surahRange: 'النمل 56 - العنكبوت 45',
  },
  {
    juzNumber: 21,
    juzName: 'اتل ما أوحي إليك',
    startAyah: 'اتْلُ مَا أُوحِيَ إِلَيْكَ مِنَ الْكِتَابِ وَأَقِمِ الصَّلَاةَ',
    surahRange: 'العنكبوت 46 - الأحزاب 30',
  },
  {
    juzNumber: 22,
    juzName: 'ومن يقنت منكن',
    startAyah: 'وَمَن يَقْنُتْ مِنكُنَّ لِلَّـهِ وَرَسُولِهِ وَتَعْمَلْ صَالِحًا',
    surahRange: 'الأحزاب 31 - يس 27',
  },
  {
    juzNumber: 23,
    juzName: 'وما أنزلنا على قومه',
    startAyah: 'وَمَا أَنزَلْنَا عَلَىٰ قَوْمِهِ مِن بَعْدِهِ مِن جُندٍ',
    surahRange: 'يس 28 - الزمر 31',
  },
  {
    juzNumber: 24,
    juzName: 'فمن أظلم ممن كذب',
    startAyah: 'فَمَنْ أَظْلَمُ مِمَّن كَذَبَ عَلَى اللَّـهِ وَكَذَّبَ بِالصِّدْقِ',
    surahRange: 'الزمر 32 - فصلت 46',
  },
  {
    juzNumber: 25,
    juzName: 'إليه يرد علم الساعة',
    startAyah: 'إِلَيْهِ يُرَدُّ عِلْمُ السَّاعَةِ وَمَا تَخْرُجُ مِن ثَمَرَاتٍ',
    surahRange: 'فصلت 47 - الجاثية 37',
  },
  {
    juzNumber: 26,
    juzName: 'حم (الأحقاف)',
    startAyah: 'حم * تَنزِيلُ الْكِتَابِ مِنَ اللَّـهِ الْعَزِيزِ الْحَكِيمِ',
    surahRange: 'الأحقاف 1 - الذاريات 30',
  },
  {
    juzNumber: 27,
    juzName: 'قال فما خطبكم',
    startAyah: 'قَالَ فَمَا خَطْبُكُمْ أَيُّهَا الْمُرْسَلُونَ',
    surahRange: 'الذاريات 31 - الحديد 29',
  },
  {
    juzNumber: 28,
    juzName: 'قد سمع الله',
    startAyah: 'قَدْ سَمِعَ اللَّـهُ قَوْلَ الَّتِي تُجَادِلُكَ فِي زَوْجِهَا',
    surahRange: 'المجادلة 1 - التحريم 12',
  },
  {
    juzNumber: 29,
    juzName: 'تبارك الذي بيده الملك',
    startAyah: 'تَبَارَكَ الَّذِي بِيَدِهِ الْمُلْكُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ',
    surahRange: 'الملك 1 - المرسلات 50',
  },
  {
    juzNumber: 30,
    juzName: 'عم يتساءلون',
    startAyah: 'عَمَّ يَتَسَاءَلُونَ * عَنِ النَّبَإِ الْعَظِيمِ',
    surahRange: 'النبأ 1 - الناس 6',
  },
];

export function createInitialJuzList(): KhatmaJuz[] {
  return QURAN_30_JUZ.map((meta) => ({
    juzNumber: meta.juzNumber,
    juzName: meta.juzName,
    surahRange: meta.surahRange,
    assignedTo: '',
    isCompleted: false,
  }));
}
