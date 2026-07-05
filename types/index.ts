// ===== EXERCISE TYPES =====

export type Difficulty = "beginner" | "intermediate" | "advanced" | "legendary";
export type Category =
  | "strength"
  | "cardio"
  | "mobility"
  | "power"
  | "core"
  | "stability";
export type Level =
  | "foundation"
  | "stability"
  | "strength"
  | "athletic"
  | "elite";
export type Equipment =
  | "none"
  | "dumbbell"
  | "barbell"
  | "kettlebell"
  | "resistance_band"
  | "cable"
  | "bodyweight"
  | "box"
  | "bench"
  | "jump_rope"
  | "battle_rope"
  | "bike"
  | "foam_roller";

export interface Exercise {
  id: string;
  name: string;
  category: Category;
  difficulty: Difficulty;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  basketballBenefit: string;
  description: string;
  coachTips: string[];
  commonMistakes: string[];
  equipment: Equipment[];
  image: string;
  video?: string;
  sets: number;
  reps: string; // e.g. "12", "8-10", "30 sec"
  timer?: number; // seconds — if exercise is timed
  rest: number; // seconds
  unlockLevel: Level;
  skillName?: string; // RPG skill name
  skillDescription?: string; // RPG skill description
  isTimed?: boolean;
}

// ===== WORKOUT TYPES =====

export type WorkoutType =
  | "court_power"
  | "cardio"
  | "recovery"
  | "basketball"
  | "flex";
export type WeekDay =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export interface WorkoutDay {
  id: string;
  name: string;
  type: WorkoutType;
  weekDay: WeekDay;
  description: string;
  estimatedDuration: number; // minutes
  difficulty: Difficulty;
  exerciseIds: string[];
  warmupIds?: string[];
  cooldownIds?: string[];
  phase: string; // e.g. "Phase 1 - Foundation"
}

export interface WorkoutPlan {
  id: string;
  name: string;
  description: string;
  totalWeeks: number;
  currentPhase: string;
  schedule: WorkoutDay[];
}

// ===== ROUTINE EXECUTION TYPES =====

export type RoutineType = "strength" | "basketball" | "recovery";

export interface RoutineExercise {
  name: string;
  sets?: number;
  reps?: number;
  durationSec?: number;
  restSec?: number;
  instruction?: string;
  coachTips?: string;
  difficulty?: number;
}

export interface RoutineSession {
  title: string;
  exercises: RoutineExercise[];
}

export interface RoutineDay {
  date: string;
  sessions: RoutineSession[];
}

export interface Routine {
  id: string;
  name: string;
  type: RoutineType;
  days: RoutineDay[];
}

export interface ExecutionStep {
  id: string;
  routineId: string;
  date: string;
  sessionIndex: number;
  exerciseIndex: number;
  sessionTitle: string;
  exercise: RoutineExercise;
}

// ===== LOGGING / PROGRESS TYPES =====

export interface ExerciseLog {
  exerciseId: string;
  setsCompleted: number;
  repsCompleted: string[];
  weightUsed?: number[];
  durationSeconds?: number;
  notes?: string;
  completedAt: string; // ISO date
}

export interface WorkoutLog {
  id: string;
  workoutDayId: string;
  date: string; // YYYY-MM-DD
  startedAt: string; // ISO date
  completedAt?: string; // ISO date
  exerciseLogs: ExerciseLog[];
  isCompleted: boolean;
  durationMinutes?: number;
  mood?: 1 | 2 | 3 | 4 | 5;
  notes?: string;
}

// ===== SKILL TYPES =====

export interface Skill {
  id: string;
  name: string;
  description: string;
  icon: string; // emoji or icon name
  associatedExerciseId: string;
  unlockLevel: Level;
  isLegendary: boolean;
  category: Category;
}

// ===== PROGRESS TYPES =====

export interface UserProgress {
  currentLevel: Level;
  totalWorkoutsCompleted: number;
  currentStreak: number;
  longestStreak: number;
  totalMinutesTrained: number;
  unlockedSkillIds: string[];
  lastWorkoutDate?: string;
}

// ===== TIMER TYPES =====

export type TimerPreset = 30 | 45 | 60 | 75 | 90 | 120;

export interface TimerConfig {
  duration: number;
  label: string;
  isActive: boolean;
  isPaused: boolean;
  remaining: number;
}

// ===== SETTINGS TYPES =====

export interface AppSettings {
  defaultRestTimer: TimerPreset;
  weightUnit: "kg" | "lbs";
  theme: "dark" | "light";
  vibrationEnabled: boolean;
  autoStartRestTimer: boolean;
  soundEnabled: boolean;
}

// ===== CALENDAR TYPES =====

export interface CalendarDay {
  date: string; // YYYY-MM-DD
  workout?: WorkoutDay;
  log?: WorkoutLog;
  isToday: boolean;
  isPast: boolean;
  isCompleted: boolean;
}

// ===== STORE TYPES (future-ready) =====

// Interface for future data service swapping (e.g. Supabase, Firebase)
export interface IDataService {
  getWorkoutLogs(): Promise<WorkoutLog[]>;
  saveWorkoutLog(log: WorkoutLog): Promise<void>;
  getUserProgress(): Promise<UserProgress>;
  saveUserProgress(progress: UserProgress): Promise<void>;
  getSettings(): Promise<AppSettings>;
  saveSettings(settings: AppSettings): Promise<void>;
}
