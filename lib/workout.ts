import workoutPlan from "@/data/workout-plan.json";
import exercises from "@/data/exercises.json";
import type {
  Exercise,
  WorkoutDay,
  WorkoutPlan,
  WeekDay,
} from "@/types";

const plan = workoutPlan as WorkoutPlan;
const exerciseList = exercises as Exercise[];

// Map weekday index to WeekDay type
const WEEKDAY_MAP: Record<number, WeekDay> = {
  0: "sunday",
  1: "monday",
  2: "tuesday",
  3: "wednesday",
  4: "thursday",
  5: "friday",
  6: "saturday",
};

/**
 * Get a local YYYY-MM-DD date string without UTC timezone shifting.
 */
export function toLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Get today's weekday as a WeekDay string
 */
export function getTodayWeekDay(): WeekDay {
  return WEEKDAY_MAP[new Date().getDay()];
}

/**
 * Get the workout scheduled for today
 */
export function getTodayWorkout(): WorkoutDay | null {
  const today = getTodayWeekDay();
  return getWorkoutForWeekDay(today);
}

/**
 * Get the workout for a specific weekday
 */
export function getWorkoutForWeekDay(weekDay: WeekDay): WorkoutDay | null {
  return plan.schedule.find((day) => day.weekDay === weekDay) ?? null;
}

/**
 * Get the workout for a specific date (YYYY-MM-DD)
 */
export function getWorkoutForDate(dateStr: string): WorkoutDay | null {
  const date = new Date(dateStr + "T00:00:00");
  const weekDay = WEEKDAY_MAP[date.getDay()];
  return getWorkoutForWeekDay(weekDay);
}

/**
 * Get an exercise by ID from the exercise library
 */
export function getExerciseById(id: string): Exercise | null {
  return exerciseList.find((ex) => ex.id === id) ?? null;
}

/**
 * Get all exercises for a given workout day
 */
export function getExercisesForWorkout(workout: WorkoutDay): Exercise[] {
  return workout.exerciseIds
    .map((id) => getExerciseById(id))
    .filter((ex): ex is Exercise => ex !== null);
}

/**
 * Get warmup exercises for a given workout day
 */
export function getWarmupExercises(workout: WorkoutDay): Exercise[] {
  return (workout.warmupIds ?? [])
    .map((id) => getExerciseById(id))
    .filter((ex): ex is Exercise => ex !== null);
}

/**
 * Get cooldown exercises for a given workout day
 */
export function getCooldownExercises(workout: WorkoutDay): Exercise[] {
  return (workout.cooldownIds ?? [])
    .map((id) => getExerciseById(id))
    .filter((ex): ex is Exercise => ex !== null);
}

/**
 * Format a duration in minutes to a human-readable string
 * e.g. 65 -> "1h 5m", 45 -> "45min"
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

/**
 * Format seconds to MM:SS
 */
export function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

/**
 * Get difficulty color class
 */
export function getDifficultyColor(
  difficulty: string
): { text: string; bg: string; border: string } {
  switch (difficulty) {
    case "beginner":
      return {
        text: "text-emerald-400",
        bg: "bg-emerald-400/10",
        border: "border-emerald-400/20",
      };
    case "intermediate":
      return {
        text: "text-amber-400",
        bg: "bg-amber-400/10",
        border: "border-amber-400/20",
      };
    case "advanced":
      return {
        text: "text-orange-400",
        bg: "bg-orange-400/10",
        border: "border-orange-400/20",
      };
    case "legendary":
      return {
        text: "text-purple-400",
        bg: "bg-purple-400/10",
        border: "border-purple-400/20",
      };
    default:
      return {
        text: "text-slate-400",
        bg: "bg-slate-400/10",
        border: "border-slate-400/20",
      };
  }
}

/**
 * Get workout type display name
 */
export function getWorkoutTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    court_power: "Court Power",
    cardio: "Cardio",
    recovery: "Recovery",
    basketball: "Basketball",
    flex: "Flex",
  };
  return labels[type] ?? type;
}

/**
 * Get all exercises in the library
 */
export function getAllExercises(): Exercise[] {
  return exerciseList;
}

/**
 * Get the full workout plan
 */
export function getWorkoutPlan(): WorkoutPlan {
  return plan;
}

/**
 * Get today's formatted date string (YYYY-MM-DD)
 */
export function getTodayDateString(): string {
  return toLocalDateString();
}

/**
 * Get a human-readable today string e.g. "Saturday, July 5"
 */
export function getTodayDisplayString(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}
