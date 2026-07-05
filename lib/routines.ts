import routines from "@/data/routines.json";
import type {
  ExecutionStep,
  Routine,
  RoutineDay,
  RoutineExercise,
} from "@/types";
import { toLocalDateString } from "@/lib/workout";

const routineList = routines as Routine[];

export function getAllRoutines(): Routine[] {
  return routineList;
}

export function getRoutineDayForDate(date: string): {
  routine: Routine;
  day: RoutineDay;
} | null {
  for (const routine of routineList) {
    const day = routine.days.find((candidate) => candidate.date === date);
    if (day) return { routine, day };
  }

  return null;
}

export function getTodayRoutineDay() {
  return getRoutineDayForDate(toLocalDateString());
}

export function getExecutionSteps(date: string): ExecutionStep[] {
  const match = getRoutineDayForDate(date);
  if (!match) return [];

  return match.day.sessions.flatMap((session, sessionIndex) =>
    session.exercises.map((exercise, exerciseIndex) => ({
      id: `${match.routine.id}-${date}-${sessionIndex}-${exerciseIndex}`,
      routineId: match.routine.id,
      date,
      sessionIndex,
      exerciseIndex,
      sessionTitle: session.title,
      exercise,
    }))
  );
}

export function getRoutineEstimatedMinutes(day: RoutineDay): number {
  const totalSeconds = day.sessions.reduce((sessionTotal, session) => {
    const exerciseSeconds = session.exercises.reduce((exerciseTotal, exercise) => {
      const setCount = exercise.sets ?? 1;
      const workSeconds =
        exercise.durationSec ?? Math.max((exercise.reps ?? 8) * 4, 30);
      const restSeconds = exercise.restSec ?? 0;

      return exerciseTotal + setCount * workSeconds + Math.max(0, setCount - 1) * restSeconds;
    }, 0);

    return sessionTotal + exerciseSeconds;
  }, 0);

  return Math.max(1, Math.round(totalSeconds / 60));
}

export function getRoutineDifficulty(day: RoutineDay): number {
  const exercises = day.sessions.flatMap((session) => session.exercises);
  if (exercises.length === 0) return 1;

  const total = exercises.reduce(
    (sum, exercise) => sum + (exercise.difficulty ?? 5),
    0
  );

  return Math.round(total / exercises.length);
}

export function getExercisePrescription(exercise: RoutineExercise): string {
  const sets = exercise.sets ? `${exercise.sets} sets` : null;
  const work = exercise.durationSec
    ? `${exercise.durationSec}s`
    : exercise.reps
    ? `${exercise.reps} reps`
    : "guided";

  return [sets, work].filter(Boolean).join(" x ");
}
