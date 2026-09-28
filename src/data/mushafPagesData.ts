/**
 * Metadata and helpers for the 604 pages of the Madinah Mushaf
 * (King Fahd Glorious Quran Printing Complex - Hafs from Asim)
 */

export interface SurahPageInfo {
  number: number;
  name: string;
  startPage: number;
}

// Starting page for each of the 114 Surahs in Madinah Mushaf (604 pages)
export const SURAH_STARTING_PAGES: SurahPageInfo[] = [
  { number: 1, name: 'الفاتحة', startPage: 1 },
  { number: 2, name: 'البقرة', startPage: 2 },
  { number: 3, name: 'آل عمران', startPage: 50 },
  { number: 4, name: 'النساء', startPage: 77 },
  { number: 5, name: 'المائدة', startPage: 106 },
  { number: 6, name: 'الأنعام', startPage: 128 },
  { number: 7, name: 'الأعراف', startPage: 151 },
  { number: 8, name: 'الأنفال', startPage: 177 },
  { number: 9, name: 'التوبة', startPage: 187 },
  { number: 10, name: 'يونس', startPage: 208 },
  { number: 11, name: 'هود', startPage: 221 },
  { number: 12, name: 'يوسف', startPage: 235 },
  { number: 13, name: 'الرعد', startPage: 249 },
  { number: 14, name: 'إبراهيم', startPage: 255 },
  { number: 15, name: 'الحجر', startPage: 262 },
  { number: 16, name: 'النحل', startPage: 267 },
  { number: 17, name: 'الإسراء', startPage: 282 },
  { number: 18, name: 'الكهف', startPage: 293 },
  { number: 19, name: 'مريم', startPage: 305 },
  { number: 20, name: 'طه', startPage: 312 },
  { number: 21, name: 'الأنبياء', startPage: 322 },
  { number: 22, name: 'الحج', startPage: 332 },
  { number: 23, name: 'المؤمنون', startPage: 342 },
  { number: 24, name: 'النور', startPage: 350 },
  { number: 25, name: 'الفرقان', startPage: 359 },
  { number: 26, name: 'الشعراء', startPage: 367 },
  { number: 27, name: 'النمل', startPage: 377 },
  { number: 28, name: 'القصص', startPage: 385 },
  { number: 29, name: 'العنكبوت', startPage: 396 },
  { number: 30, name: 'الروم', startPage: 404 },
  { number: 31, name: 'لقمان', startPage: 411 },
  { number: 32, name: 'السجدة', startPage: 415 },
  { number: 33, name: 'الأحزاب', startPage: 418 },
  { number: 34, name: 'سبأ', startPage: 428 },
  { number: 35, name: 'فاطر', startPage: 434 },
  { number: 36, name: 'يس', startPage: 440 },
  { number: 37, name: 'الصافات', startPage: 446 },
  { number: 38, name: 'ص', startPage: 453 },
  { number: 39, name: 'الزمر', startPage: 458 },
  { number: 40, name: 'غافر', startPage: 467 },
  { number: 41, name: 'فصلت', startPage: 477 },
  { number: 42, name: 'الشورى', startPage: 483 },
  { number: 43, name: 'الزخرف', startPage: 489 },
  { number: 44, name: 'الدخان', startPage: 496 },
  { number: 45, name: 'الجاثية', startPage: 499 },
  { number: 46, name: 'الأحقاف', startPage: 502 },
  { number: 47, name: 'محمد', startPage: 507 },
  { number: 48, name: 'الفتح', startPage: 511 },
  { number: 49, name: 'الحجرات', startPage: 515 },
  { number: 50, name: 'ق', startPage: 518 },
  { number: 51, name: 'الذاريات', startPage: 520 },
  { number: 52, name: 'الطور', startPage: 523 },
  { number: 53, name: 'النجم', startPage: 526 },
  { number: 54, name: 'القمر', startPage: 528 },
  { number: 55, name: 'الرحمن', startPage: 531 },
  { number: 56, name: 'الواقعة', startPage: 534 },
  { number: 57, name: 'الحديد', startPage: 537 },
  { number: 58, name: 'المجادلة', startPage: 542 },
  { number: 59, name: 'الحشر', startPage: 545 },
  { number: 60, name: 'الممتحنة', startPage: 549 },
  { number: 61, name: 'الصف', startPage: 551 },
  { number: 62, name: 'الجمعة', startPage: 553 },
  { number: 63, name: 'المنافقون', startPage: 554 },
  { number: 64, name: 'التغابن', startPage: 556 },
  { number: 65, name: 'الطلاق', startPage: 558 },
  { number: 66, name: 'التحريم', startPage: 560 },
  { number: 67, name: 'الملك', startPage: 562 },
  { number: 68, name: 'القلم', startPage: 564 },
  { number: 69, name: 'الحاقة', startPage: 566 },
  { number: 70, name: 'المعارج', startPage: 568 },
  { number: 71, name: 'نوح', startPage: 570 },
  { number: 72, name: 'الجن', startPage: 572 },
  { number: 73, name: 'المزمل', startPage: 574 },
  { number: 74, name: 'المدثر', startPage: 575 },
  { number: 75, name: 'القيامة', startPage: 577 },
  { number: 76, name: 'الإنسان', startPage: 578 },
  { number: 77, name: 'المرسلات', startPage: 580 },
  { number: 78, name: 'النبأ', startPage: 582 },
  { number: 79, name: 'النازعات', startPage: 583 },
  { number: 80, name: 'عبس', startPage: 585 },
  { number: 81, name: 'التكوير', startPage: 586 },
  { number: 82, name: 'الانفطار', startPage: 587 },
  { number: 83, name: 'المطففين', startPage: 587 },
  { number: 84, name: 'الانشقاق', startPage: 589 },
  { number: 85, name: 'البروج', startPage: 590 },
  { number: 86, name: 'الطارق', startPage: 591 },
  { number: 87, name: 'الأعلى', startPage: 591 },
  { number: 88, name: 'الغاشية', startPage: 592 },
  { number: 89, name: 'الفجر', startPage: 593 },
  { number: 90, name: 'البلد', startPage: 594 },
  { number: 91, name: 'الشمس', startPage: 595 },
  { number: 92, name: 'الليل', startPage: 595 },
  { number: 93, name: 'الضحى', startPage: 596 },
  { number: 94, name: 'الشرح', startPage: 596 },
  { number: 95, name: 'التين', startPage: 597 },
  { number: 96, name: 'العلق', startPage: 597 },
  { number: 97, name: 'القدر', startPage: 598 },
  { number: 98, name: 'البينة', startPage: 598 },
  { number: 99, name: 'الزلزلة', startPage: 599 },
  { number: 100, name: 'العاديات', startPage: 599 },
  { number: 101, name: 'القارعة', startPage: 600 },
  { number: 102, name: 'التكاثر', startPage: 600 },
  { number: 103, name: 'العصر', startPage: 601 },
  { number: 104, name: 'الهمزة', startPage: 601 },
  { number: 105, name: 'الفيل', startPage: 601 },
  { number: 106, name: 'قريش', startPage: 602 },
  { number: 107, name: 'الماعون', startPage: 602 },
  { number: 108, name: 'الكوثر', startPage: 602 },
  { number: 109, name: 'الكافرون', startPage: 603 },
  { number: 110, name: 'النصر', startPage: 603 },
  { number: 111, name: 'المسد', startPage: 603 },
  { number: 112, name: 'الإخلاص', startPage: 604 },
  { number: 113, name: 'الفلق', startPage: 604 },
  { number: 114, name: 'الناس', startPage: 604 },
];

export interface JuzInfo {
  juzNumber: number;
  name: string;
  startPage: number;
}

export const JUZ_STARTING_PAGES: JuzInfo[] = [
  { juzNumber: 1, name: 'الجزء الأول (الم)', startPage: 1 },
  { juzNumber: 2, name: 'الجزء الثاني (سيقول)', startPage: 22 },
  { juzNumber: 3, name: 'الجزء الثالث (تلك الرسل)', startPage: 42 },
  { juzNumber: 4, name: 'الجزء الرابع (لن تنالوا)', startPage: 62 },
  { juzNumber: 5, name: 'الجزء الخامس (والمحصنات)', startPage: 82 },
  { juzNumber: 6, name: 'الجزء السادس (لا يحب الله)', startPage: 102 },
  { juzNumber: 7, name: 'الجزء السابع (وإذا سمعوا)', startPage: 122 },
  { juzNumber: 8, name: 'الجزء الثامن (ولو أننا)', startPage: 142 },
  { juzNumber: 9, name: 'الجزء التاسع (قال الملأ)', startPage: 162 },
  { juzNumber: 10, name: 'الجزء العاشر (واعلموا)', startPage: 182 },
  { juzNumber: 11, name: 'الجزء الحادي عشر (يعتذرون)', startPage: 202 },
  { juzNumber: 12, name: 'الجزء الثاني عشر (وما من دابة)', startPage: 222 },
  { juzNumber: 13, name: 'الجزء الثالث عشر (وما أبرئ)', startPage: 242 },
  { juzNumber: 14, name: 'الجزء الرابع عشر (ربما)', startPage: 262 },
  { juzNumber: 15, name: 'الجزء الخامس عشر (سبحان الذي)', startPage: 282 },
  { juzNumber: 16, name: 'الجزء السادس عشر (قال ألم)', startPage: 302 },
  { juzNumber: 17, name: 'الجزء السابع عشر (اقترب للناس)', startPage: 322 },
  { juzNumber: 18, name: 'الجزء الثامن عشر (قد أفلح)', startPage: 342 },
  { juzNumber: 19, name: 'الجزء التاسع عشر (وقال الذين)', startPage: 362 },
  { juzNumber: 20, name: 'الجزء العشرون (أمن خلق)', startPage: 382 },
  { juzNumber: 21, name: 'الجزء الحادي والعشرون (اتل ما أوحي)', startPage: 402 },
  { juzNumber: 22, name: 'الجزء الثاني والعشرون (ومن يقنت)', startPage: 422 },
  { juzNumber: 23, name: 'الجزء الثالث والعشرون (وما أنزلنا)', startPage: 442 },
  { juzNumber: 24, name: 'الجزء الرابع والعشرون (فمن أظلم)', startPage: 462 },
  { juzNumber: 25, name: 'الجزء الخامس والعشرون (إليه يرد)', startPage: 482 },
  { juzNumber: 26, name: 'الجزء السادس والعشرون (حم)', startPage: 502 },
  { juzNumber: 27, name: 'الجزء السابع والعشرون (قال فما خطبكم)', startPage: 522 },
  { juzNumber: 28, name: 'الجزء الثامن والعشرون (قد سمع)', startPage: 542 },
  { juzNumber: 29, name: 'الجزء التاسع والعشرون (تبارك)', startPage: 562 },
  { juzNumber: 30, name: 'الجزء الثلاثون (عم يتساءلون)', startPage: 582 },
];

/**
 * Returns the Juz number for any page (1-604)
 */
export function getJuzForPage(page: number): number {
  for (let i = JUZ_STARTING_PAGES.length - 1; i >= 0; i--) {
    if (page >= JUZ_STARTING_PAGES[i].startPage) {
      return JUZ_STARTING_PAGES[i].juzNumber;
    }
  }
  return 1;
}

/**
 * Returns the primary Surah name for any page (1-604)
 */
export function getSurahForPage(page: number): SurahPageInfo {
  for (let i = SURAH_STARTING_PAGES.length - 1; i >= 0; i--) {
    if (page >= SURAH_STARTING_PAGES[i].startPage) {
      return SURAH_STARTING_PAGES[i];
    }
  }
  return SURAH_STARTING_PAGES[0];
}

/**
 * Construct primary high-res CDN URL for a page
 */
export function getPrimaryPageImageUrl(pageNumber: number): string {
  const padded = pageNumber.toString().padStart(3, '0');
  return `https://files.quran.app/hafs/madani/width_1024/page${padded}.png`;
}

/**
 * Construct fallback CDN URL from QuranFlash Medina2 servers
 */
export function getFallbackPageImageUrl(pageNumber: number): string {
  const padded = pageNumber.toString().padStart(4, '0');
  return `https://www.quranflash.com/books/Medina2/data/N/${padded}.png`;
}
