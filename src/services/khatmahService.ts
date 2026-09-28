import { Khatmah, KhatmahPart } from '../types/khatmah';
import { JUZ_STARTING_PAGES } from '../data/mushafPagesData';

const STORAGE_KEY = 'salati_khatmahs_list';
const ACTIVE_KHATMAH_KEY = 'salati_active_khatmah_id';

const JUZ_SURAH_DESCRIPTIONS: Record<number, string> = {
  1: 'الفاتحة والبقرة',
  2: 'البقرة',
  3: 'البقرة وآل عمران',
  4: 'آل عمران والنساء',
  5: 'النساء',
  6: 'النساء والمائدة',
  7: 'المائدة والأنعام',
  8: 'الأنعام والأعراف',
  9: 'الأعراف والأنفال',
  10: 'الأنفال والتوبة',
  11: 'التوبة ويونس وهود',
  12: 'هود ويوسف',
  13: 'يوسف والرعد وإبراهيم والحجر',
  14: 'الحجر والنحل',
  15: 'الإسراء والكهف',
  16: 'الكهف ومريم وطه',
  17: 'الأنبياء والحج',
  18: 'المؤمنون والنور والفرقان',
  19: 'الفرقان والشعراء والنمل',
  20: 'النمل والقصص والعنكبوت',
  21: 'العنكبوت والروم ولقمان والسجدة والأحزاب',
  22: 'الأحزاب وسبأ وفاطر ويس',
  23: 'يس والصافات وص والزمر',
  24: 'الزمر وغافر وفصلت',
  25: 'فصلت والشورى والزخرف والدخان والجاثية',
  26: 'الأحقاف ومحمد والفتح والحجرات وق والذاريات',
  27: 'الذاريات والطور والنجم والقمر والرحمن والواقعة والحديد',
  28: 'المجادلة إلى التحريم',
  29: 'تبارك (الملك إلى المرسلات)',
  30: 'عم يتساءلون (النبأ إلى الناس)',
};

export function createDefaultParts(): KhatmahPart[] {
  return JUZ_STARTING_PAGES.map((j) => ({
    partNumber: j.juzNumber,
    name: j.name,
    startPage: j.startPage,
    startSurah: JUZ_SURAH_DESCRIPTIONS[j.juzNumber] || '',
    assignedTo: '',
    isCompleted: false,
  }));
}

export const khatmahService = {
  getKhatmahs(): Khatmah[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load khatmahs', e);
    }

    // Default sample initial khatmah if none exists
    const initial: Khatmah = {
      id: 'khatmah-default-1',
      title: 'ختمة النور والبركة',
      intention: 'طلباً للأجر والثواب وبركة القرآن وتيسير الأمور',
      creatorName: 'أنا',
      createdAt: new Date().toISOString(),
      isCompleted: false,
      parts: createDefaultParts(),
    };

    // Assign some sample names for inspiration
    initial.parts[0].assignedTo = 'إسماعيل';
    initial.parts[0].isCompleted = true;
    initial.parts[0].completedAt = new Date().toISOString();
    initial.parts[1].assignedTo = 'فاطمة';
    initial.parts[2].assignedTo = 'محمد';
    initial.parts[3].assignedTo = 'مريم';
    initial.parts[4].assignedTo = 'أحمد';

    khatmahService.saveKhatmahs([initial]);
    khatmahService.setActiveKhatmahId(initial.id);
    return [initial];
  },

  saveKhatmahs(list: Khatmah[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.error('Failed to save khatmahs', e);
    }
  },

  getActiveKhatmahId(): string | null {
    try {
      return localStorage.getItem(ACTIVE_KHATMAH_KEY);
    } catch {
      return null;
    }
  },

  setActiveKhatmahId(id: string): void {
    try {
      localStorage.setItem(ACTIVE_KHATMAH_KEY, id);
    } catch {}
  },

  createKhatmah(title: string, intention?: string, creatorName = 'المنظم'): Khatmah {
    const newKhatmah: Khatmah = {
      id: `khatmah-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      title: title.trim() || 'ختمة مباركة جديدة',
      intention: intention?.trim() || '',
      creatorName: creatorName.trim() || 'المنظم',
      createdAt: new Date().toISOString(),
      isCompleted: false,
      parts: createDefaultParts(),
    };

    const currentList = khatmahService.getKhatmahs();
    const updated = [newKhatmah, ...currentList];
    khatmahService.saveKhatmahs(updated);
    khatmahService.setActiveKhatmahId(newKhatmah.id);
    return newKhatmah;
  },

  updatePart(
    khatmahId: string,
    partNumber: number,
    updates: Partial<KhatmahPart>
  ): Khatmah | null {
    const list = khatmahService.getKhatmahs();
    const kIndex = list.findIndex((k) => k.id === khatmahId);
    if (kIndex === -1) return null;

    const khatmah = { ...list[kIndex] };
    const pIndex = khatmah.parts.findIndex((p) => p.partNumber === partNumber);
    if (pIndex === -1) return null;

    const updatedPart = { ...khatmah.parts[pIndex], ...updates };
    if (updates.isCompleted && !updatedPart.completedAt) {
      updatedPart.completedAt = new Date().toISOString();
    } else if (updates.isCompleted === false) {
      delete updatedPart.completedAt;
    }

    khatmah.parts[pIndex] = updatedPart;

    // Check if entire khatmah is completed
    const allCompleted = khatmah.parts.every((p) => p.isCompleted);
    if (allCompleted && !khatmah.isCompleted) {
      khatmah.isCompleted = true;
      khatmah.completedAt = new Date().toISOString();
    } else if (!allCompleted) {
      khatmah.isCompleted = false;
      delete khatmah.completedAt;
    }

    list[kIndex] = khatmah;
    khatmahService.saveKhatmahs(list);
    return khatmah;
  },

  setCompletedPartsCount(khatmahId: string, count: number): Khatmah | null {
    const list = khatmahService.getKhatmahs();
    const kIndex = list.findIndex((k) => k.id === khatmahId);
    if (kIndex === -1) return null;

    const khatmah = { ...list[kIndex] };
    const validCount = Math.max(0, Math.min(30, Math.floor(count)));

    khatmah.parts = khatmah.parts.map((p) => {
      const isCompleted = p.partNumber <= validCount;
      return {
        ...p,
        isCompleted,
        completedAt: isCompleted ? (p.completedAt || new Date().toISOString()) : undefined,
      };
    });

    khatmah.isCompleted = validCount === 30;
    if (khatmah.isCompleted && !khatmah.completedAt) {
      khatmah.completedAt = new Date().toISOString();
    } else if (!khatmah.isCompleted) {
      delete khatmah.completedAt;
    }

    list[kIndex] = khatmah;
    khatmahService.saveKhatmahs(list);
    return khatmah;
  },

  deleteKhatmah(id: string): Khatmah[] {
    const list = khatmahService.getKhatmahs().filter((k) => k.id !== id);
    khatmahService.saveKhatmahs(list);
    if (list.length > 0) {
      khatmahService.setActiveKhatmahId(list[0].id);
    } else {
      try {
        localStorage.removeItem(ACTIVE_KHATMAH_KEY);
      } catch {}
    }
    return list;
  },
};
