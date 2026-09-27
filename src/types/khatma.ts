export interface KhatmaJuz {
  juzNumber: number;
  juzName: string;
  surahRange: string;
  assignedTo: string;
  isCompleted: boolean;
  completedAt?: string;
  notes?: string;
}

export interface Khatma {
  id: string;
  title: string;
  targetDate: string;
  notes?: string;
  createdAt: string;
  juzList: KhatmaJuz[];
}
