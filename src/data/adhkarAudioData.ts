export interface AdhkarAudioTrack {
  id: string;
  title: string;
  category:
    | 'all'
    | 'morning'
    | 'evening'
    | 'morning_evening'
    | 'sleep'
    | 'prayer'
    | 'istikhara'
    | 'doors';
  categoryLabel: string;
  reciter: string;
  durationLabel: string;
  audioUrl: string;
  sourceLabel: string;
  sourceUrl: string;
  description: string;
}

export const ADHKAR_AUDIO_TRACKS: AdhkarAudioTrack[] = [
  {
    id: 'sabah_alafasy',
    title: 'أذكار الصباح كاملة',
    category: 'morning',
    categoryLabel: 'أذكار الصباح',
    reciter: 'الشيخ مشاري راشد العفاسي',
    durationLabel: 'تسجيل استوديو كامل ونقي',
    audioUrl: 'https://www.ashefaa.com/ruqia/Azkar/1.mp3',
    sourceLabel: 'مكتبة شبكة الشفاء الإسلامية',
    sourceUrl: 'https://www.ashefaa.com/catsmktba-890.html',
    description: 'تلاوة وترتيل خاشع ومؤثر لجميع أذكار الصباح المأثورة عن النبي ﷺ من حصن المسلم.',
  },
  {
    id: 'masaa_alafasy',
    title: 'أذكار المساء كاملة',
    category: 'evening',
    categoryLabel: 'أذكار المساء',
    reciter: 'الشيخ مشاري راشد العفاسي',
    durationLabel: 'تسجيل استوديو كامل ونقي',
    audioUrl: 'https://www.ashefaa.com/ruqia/Azkar/2.mp3',
    sourceLabel: 'مكتبة شبكة الشفاء الإسلامية',
    sourceUrl: 'https://www.ashefaa.com/catsmktba-890.html',
    description: 'أذكار المساء كاملة للتحصين والحفظ والسكينة حتى الإصباح بصوت الشيخ مشاري العفاسي.',
  },
  {
    id: 'sabah_masaa_combined',
    title: 'أذكار الصباح والمساء المدمجة',
    category: 'morning_evening',
    categoryLabel: 'الصباح والمساء معاً',
    reciter: 'الشيخ مشاري راشد العفاسي',
    durationLabel: 'تسجيل مطول عالي الجودة',
    audioUrl: 'https://www.ashefaa.com/ruqia/Azkar/mishery-azkar.mp3',
    sourceLabel: 'مكتبة شبكة الشفاء الإسلامية',
    sourceUrl: 'https://www.ashefaa.com/catsmktba-890.html',
    description: 'الإصدار الصوتي الشهير الشامل لأذكار طرفي النهار (الصباح والمساء) في تسجيل واحد متواصل.',
  },
  {
    id: 'nawm_alafasy',
    title: 'أذكار النوم والسكينة',
    category: 'sleep',
    categoryLabel: 'أذكار النوم',
    reciter: 'الشيخ مشاري راشد العفاسي',
    durationLabel: 'تسجيل مهدئ للروح',
    audioUrl: 'https://www.ashefaa.com/ruqia/Azkar/Azkar-alnawm.mp3',
    sourceLabel: 'مكتبة شبكة الشفاء الإسلامية',
    sourceUrl: 'https://www.ashefaa.com/catsmktba-890.html',
    description: 'أدعية النوم، آية الكرسي، المعوذات، وتسابيح النوم لطمأنينة القلب والنوم على الفطرة.',
  },
  {
    id: 'istikhara_alafasy',
    title: 'دعاء صلاة الاستخارة النبوي للتعليم',
    category: 'istikhara',
    categoryLabel: 'الاستخارة',
    reciter: 'الشيخ مشاري راشد العفاسي',
    durationLabel: 'دعاء مروي محقق',
    audioUrl: 'https://www.ashefaa.com/jawal/enshad/%D8%AF%D8%B9%D8%A7%D8%A1-%D8%A7%D9%84%D8%A7%D8%B3%D8%AA%D8%AE%D8%A7%D8%B1%D8%A9.mp3',
    sourceLabel: 'مكتبة شبكة الشفاء الإسلامية',
    sourceUrl: 'https://www.ashefaa.com/catsmktba-890.html',
    description: 'الدعاء الوارد في صحيح البخاري لصلاة الاستخارة مع التمهل لتيسير الحفظ والترديد.',
  },
  {
    id: 'wake_duraihem',
    title: 'أذكار الاستيقاظ من النوم (حصن المسلم)',
    category: 'doors',
    categoryLabel: 'أبواب حصن المسلم',
    reciter: 'الشيخ حمد الدريهم',
    durationLabel: 'الباب الأول من حصن المسلم',
    audioUrl: 'https://www.ashefaa.com/ruqia/Azkar/hisn-almuslim/ar_7esn_AlMoslem_by_Doors_002.mp3',
    sourceLabel: 'مكتبة شبكة الشفاء الإسلامية',
    sourceUrl: 'https://www.ashefaa.com/catsmktba-890.html',
    description: 'الحمد لله الذي أحيانا بعد ما أماتنا، ودعاء من تعارّ من الليل مع شرح الأذكار.',
  },
  {
    id: 'home_exit_alafasy',
    title: 'دعاء الخروج من المنزل',
    category: 'doors',
    categoryLabel: 'أبواب حصن المسلم',
    reciter: 'الشيخ مشاري راشد العفاسي',
    durationLabel: 'حصن للمسلم عند الخروج',
    audioUrl: 'https://www.ashefaa.com/ruqia/2.mp3',
    sourceLabel: 'مكتبة شبكة الشفاء الإسلامية',
    sourceUrl: 'https://www.ashefaa.com/catsmktba-890.html',
    description: 'بسم الله توكلت على الله لا حول ولا قوة إلا بالله، اللهم إني أعوذ بك أن أضل أو أُضل.',
  },
  {
    id: 'mosque_enter_exit',
    title: 'دعاء دخول وخروج المسجد',
    category: 'doors',
    categoryLabel: 'أبواب حصن المسلم',
    reciter: 'الشيخ حمد الدريهم',
    durationLabel: 'أدعية المسجد المباركة',
    audioUrl: 'https://www.ashefaa.com/ruqia/Azkar/hisn-almuslim/ar_7esn_AlMoslem_by_Doors_021.mp3',
    sourceLabel: 'مكتبة شبكة الشفاء الإسلامية',
    sourceUrl: 'https://www.ashefaa.com/catsmktba-890.html',
    description: 'دعاء دخول المسجد وسؤال أبواب الرحمة والاعتصام من الشيطان الرجيم عند الخروج.',
  },
  {
    id: 'prayer_after_duraihem',
    title: 'الأذكار بعد السلام من الصلاة المكتوبة',
    category: 'prayer',
    categoryLabel: 'الصلاة والأذان',
    reciter: 'الشيخ حمد الدريهم',
    durationLabel: 'أذكار دبر الصلوات',
    audioUrl: 'https://www.ashefaa.com/ruqia/Azkar/hisn-almuslim/ar_7esn_AlMoslem_by_Doors_025.mp3',
    sourceLabel: 'مكتبة شبكة الشفاء الإسلامية',
    sourceUrl: 'https://www.ashefaa.com/catsmktba-890.html',
    description: 'الاستغفار، اللهم أنت السلام، لا إله إلا الله وحده لا شريك له، والتسبيح بعد الفريضة.',
  },
  {
    id: 'hisn_sabah_masaa_duraihem',
    title: 'أذكار الصباح والمساء مرتبة بالأبواب',
    category: 'morning_evening',
    categoryLabel: 'حصن المسلم',
    reciter: 'الشيخ حمد الدريهم',
    durationLabel: 'سلسلة حصن المسلم الصوتية',
    audioUrl: 'https://www.ashefaa.com/ruqia/Azkar/hisn-almuslim/ar_7esn_AlMoslem_by_Doors_027.mp3',
    sourceLabel: 'مكتبة شبكة الشفاء الإسلامية',
    sourceUrl: 'https://www.ashefaa.com/catsmktba-890.html',
    description: 'قراءة محققة لأذكار الصباح والمساء وفق ترتيب كتاب حصن المسلم لسعيد القحطاني.',
  },
];
