/**
 * Types for Quran Khatmah (Group & Individual Khatmahs)
 */

export interface KhatmahPart {
  partNumber: number; // 1 to 30
  name: string; // e.g., 'الجزء الأول (الم)'
  startPage: number; // e.g. 1
  startSurah: string; // e.g. 'سورة الفاتحة والبقرة'
  assignedTo: string; // Person's name, e.g. 'إسماعيل'
  isCompleted: boolean;
  completedAt?: string;
  notes?: string;
}

export interface Khatmah {
  id: string;
  title: string;
  intention?: string; // نية الختمة (مثلاً: لروح الوالدين / شكر وتوفيق / طلب الشفاء)
  creatorName: string;
  createdAt: string;
  isCompleted: boolean;
  completedAt?: string;
  parts: KhatmahPart[];
}

export interface KhatmahShareCardData {
  khatmahTitle: string;
  intention?: string;
  partNumber: number;
  partName: string;
  personName: string;
  completedAt: string;
  totalCompletedInKhatmah: number;
  totalParts: number;
}
