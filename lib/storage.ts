import type {
  WorkoutLog,
  UserProgress,
  AppSettings,
  IDataService,
} from "@/types";
import { toLocalDateString } from "@/lib/workout";

// ===== STORAGE KEYS =====
const KEYS = {
  WORKOUT_LOGS: "rebound_workout_logs",
  USER_PROGRESS: "rebound_user_progress",
  SETTINGS: "rebound_settings",
} as const;

// ===== DEFAULT VALUES =====
const DEFAULT_PROGRESS: UserProgress = {
  currentLevel: "foundation",
  totalWorkoutsCompleted: 0,
  currentStreak: 0,
  longestStreak: 0,
  totalMinutesTrained: 0,
  unlockedSkillIds: [],
  lastWorkoutDate: undefined,
};

const DEFAULT_SETTINGS: AppSettings = {
  defaultRestTimer: 90,
  weightUnit: "kg",
  theme: "dark",
  vibrationEnabled: true,
  autoStartRestTimer: true,
  soundEnabled: true,
};

// ===== SAFE STORAGE ACCESS =====
function safeGetItem(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, value);
  } catch {
    console.error("Failed to save to localStorage");
  }
}

// ===== WORKOUT LOGS =====
export function getWorkoutLogs(): WorkoutLog[] {
  const raw = safeGetItem(KEYS.WORKOUT_LOGS);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as WorkoutLog[];
  } catch {
    return [];
  }
}

export function saveWorkoutLog(log: WorkoutLog): void {
  const logs = getWorkoutLogs();
  const existingIndex = logs.findIndex((l) => l.id === log.id);
  if (existingIndex >= 0) {
    logs[existingIndex] = log;
  } else {
    logs.push(log);
  }
  safeSetItem(KEYS.WORKOUT_LOGS, JSON.stringify(logs));
  syncUserProgress(logs);
}

export function getWorkoutLogForDate(dateStr: string): WorkoutLog | null {
  const logs = getWorkoutLogs();
  return logs.find((l) => l.date === dateStr) ?? null;
}

export function clearWorkoutLogs(): void {
  safeSetItem(KEYS.WORKOUT_LOGS, JSON.stringify([]));
  saveUserProgress({ ...DEFAULT_PROGRESS });
}

// ===== USER PROGRESS =====
export function getUserProgress(): UserProgress {
  const raw = safeGetItem(KEYS.USER_PROGRESS);
  if (!raw) return { ...DEFAULT_PROGRESS };
  try {
    return { ...DEFAULT_PROGRESS, ...(JSON.parse(raw) as UserProgress) };
  } catch {
    return { ...DEFAULT_PROGRESS };
  }
}

export function saveUserProgress(progress: UserProgress): void {
  safeSetItem(KEYS.USER_PROGRESS, JSON.stringify(progress));
}

export function resetUserProgress(): void {
  safeSetItem(KEYS.USER_PROGRESS, JSON.stringify(DEFAULT_PROGRESS));
}

function getLevelForCompletedWorkouts(total: number): UserProgress["currentLevel"] {
  if (total >= 50) return "elite";
  if (total >= 30) return "athletic";
  if (total >= 15) return "strength";
  if (total >= 5) return "stability";
  return "foundation";
}

function syncUserProgress(logs: WorkoutLog[]): void {
  const completedLogs = logs.filter((l) => l.isCompleted);
  const streak = calculateStreak(logs);
  const totalMinutesTrained = completedLogs.reduce(
    (sum, log) => sum + (log.durationMinutes ?? 0),
    0
  );

  saveUserProgress({
    currentLevel: getLevelForCompletedWorkouts(completedLogs.length),
    totalWorkoutsCompleted: completedLogs.length,
    currentStreak: streak.current,
    longestStreak: streak.longest,
    totalMinutesTrained,
    unlockedSkillIds: [],
    lastWorkoutDate: completedLogs.at(-1)?.date,
  });
}

// ===== SETTINGS =====
export function getSettings(): AppSettings {
  const raw = safeGetItem(KEYS.SETTINGS);
  if (!raw) return { ...DEFAULT_SETTINGS };
  try {
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as AppSettings) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: AppSettings): void {
  safeSetItem(KEYS.SETTINGS, JSON.stringify(settings));
}

// ===== STREAK COMPUTATION =====
/**
 * Calculate the current streak from workout logs.
 * A streak is consecutive days with a completed workout.
 */
export function calculateStreak(logs: WorkoutLog[]): {
  current: number;
  longest: number;
} {
  const completed = logs
    .filter((l) => l.isCompleted)
    .map((l) => l.date)
    .sort()
    .reverse();

  if (completed.length === 0) return { current: 0, longest: 0 };

  let current = 0;
  let longest = 0;

  const today = new Date();
  const todayStr = toLocalDateString(today);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = toLocalDateString(yesterday);

  // Check if the last workout was today or yesterday (streak alive)
  if (completed[0] !== todayStr && completed[0] !== yesterdayStr) {
    return { current: 0, longest: calculateLongestStreak(completed) };
  }

  current = 1;
  for (let i = 1; i < completed.length; i++) {
    const curr = new Date(completed[i]);
    const prev = new Date(completed[i - 1]);
    const diffDays = Math.round(
      (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays === 1) {
      current++;
    } else {
      break;
    }
  }

  longest = calculateLongestStreak(completed);
  return { current, longest };
}

function calculateLongestStreak(sortedDescDates: string[]): number {
  if (sortedDescDates.length === 0) return 0;
  let longest = 1;
  let current = 1;
  for (let i = 1; i < sortedDescDates.length; i++) {
    const curr = new Date(sortedDescDates[i]);
    const prev = new Date(sortedDescDates[i - 1]);
    const diffDays = Math.round(
      (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays === 1) {
      current++;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }
  return longest;
}

// ===== COMPLETION STATS =====
export function getCompletionRate(
  logs: WorkoutLog[],
  days: number = 30
): number {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const recentLogs = logs.filter((l) => new Date(l.date) >= cutoff);
  if (recentLogs.length === 0) return 0;
  const completed = recentLogs.filter((l) => l.isCompleted).length;
  return Math.round((completed / recentLogs.length) * 100);
}

// ===== SERVICE ADAPTER (Future-ready) =====
/**
 * LocalStorage implementation of IDataService.
 * Swap this with a SupabaseDataService or FirebaseDataService in the future
 * without changing any consumer code.
 */
export class LocalStorageDataService implements IDataService {
  async getWorkoutLogs(): Promise<WorkoutLog[]> {
    return getWorkoutLogs();
  }
  async saveWorkoutLog(log: WorkoutLog): Promise<void> {
    saveWorkoutLog(log);
  }
  async getUserProgress(): Promise<UserProgress> {
    return getUserProgress();
  }
  async saveUserProgress(progress: UserProgress): Promise<void> {
    saveUserProgress(progress);
  }
  async getSettings(): Promise<AppSettings> {
    return getSettings();
  }
  async saveSettings(settings: AppSettings): Promise<void> {
    saveSettings(settings);
  }
}
