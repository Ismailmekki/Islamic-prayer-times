/**
 * Arabic & Multilingual City Search Normalizer
 * Handles hamzas, tashkeel, taa marbuta, prefixes (ال), and fuzzy matching.
 */

export function normalizeArabic(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    // Remove Arabic diacritics / Harakat
    .replace(/[\u064B-\u065F\u0670]/g, '')
    // Normalize Alefs & Hamzas
    .replace(/[أإآء]/g, 'ا')
    // Normalize Taa Marbuta to Haa
    .replace(/ة/g, 'ه')
    // Normalize Alef Maksura to Yaa
    .replace(/ى/g, 'ي')
    // Remove Tatweel / Kashida
    .replace(/ـ/g, '')
    // Normalize multiple spaces
    .replace(/\s+/g, ' ');
}

export function matchArabicText(target: string, query: string): boolean {
  if (!query || !query.trim()) return true;
  if (!target) return false;

  const normTarget = normalizeArabic(target);
  const normQuery = normalizeArabic(query);

  if (normTarget.includes(normQuery)) return true;

  // Check without leading "ال" (Definite article)
  const targetWords = normTarget.split(' ');
  const queryWords = normQuery.split(' ');

  for (const qWord of queryWords) {
    const qClean = qWord.replace(/^ال/, '');
    const foundInAny = targetWords.some((tWord) => {
      const tClean = tWord.replace(/^ال/, '');
      return tClean.includes(qClean) || tWord.includes(qClean);
    });
    if (!foundInAny) return false;
  }

  return true;
}
