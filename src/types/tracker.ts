export type Difficulty = "EASY" | "MEDIUM" | "HARD";
export type ProblemSource = "LEETCODE" | "CUSTOM";
export type Level = 0 | 1 | 2 | 3;

export const TAG_COLORS = [
  "gray",
  "red",
  "orange",
  "amber",
  "green",
  "teal",
  "blue",
  "indigo",
  "violet",
  "pink",
] as const;
export type TagColor = (typeof TAG_COLORS)[number];

export interface CategoryDto {
  id: string;
  name: string;
  parentId: string | null;
  position: number;
}

export interface RecordDto {
  id: string;
  problemId: string;
  date: string; // YYYY-MM-DD
  level: Level;
  note: string | null;
}

export interface ProblemDto {
  id: string;
  categoryId: string;
  source: ProblemSource;
  number: string;
  title: string;
  difficulty: Difficulty | null;
  url: string | null;
  position: number;
  tagIds: string[];
  records: RecordDto[]; // newest first
}

export interface TagDto {
  id: string;
  name: string;
  color: TagColor;
}

export interface SettingsDto {
  intervals: [number, number, number, number];
  /** "Soon" = due within this many days; also the Due page's window */
  soonDays: number;
}

export interface Bootstrap {
  categories: CategoryDto[];
  problems: ProblemDto[];
  tags: TagDto[];
  settings: SettingsDto;
}
