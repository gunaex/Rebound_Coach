"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Check,
  ChevronRight,
  Flame,
  Pause,
  Play,
  RotateCcw,
  SkipForward,
  Timer,
  Trophy,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  getExercisePrescription,
  getExecutionSteps,
  getRoutineDayForDate,
  getRoutineDifficulty,
  getRoutineEstimatedMinutes,
} from "@/lib/routines";
import { formatDuration, formatTimer, getTodayDateString } from "@/lib/workout";
import { getSettings, getWorkoutLogs, saveWorkoutLog } from "@/lib/storage";
import type { ExecutionStep, WorkoutLog } from "@/types";
import { cn } from "@/lib/utils";

type ExecutionState =
  | "IDLE"
  | "LOADING_WORKOUT"
  | "READY"
  | "IN_PROGRESS"
  | "RESTING"
  | "NEXT_EXERCISE"
  | "COMPLETED";

const TIMER_PRESETS = [30, 45, 60, 90, 120] as const;

export function WorkoutPageClient() {
  const [state, setState] = useState<ExecutionState>("IDLE");
  const [date, setDate] = useState("");
  const [steps, setSteps] = useState<ExecutionStep[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [skippedIds, setSkippedIds] = useState<Set<string>>(new Set());
  const [remaining, setRemaining] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedMinutes, setElapsedMinutes] = useState(0);
  const [feltDifficulty, setFeltDifficulty] = useState<number | null>(null);
  const [defaultRest, setDefaultRest] = useState(90);
  const startTimeRef = useRef<Date | null>(null);

  useEffect(() => {
    setState("LOADING_WORKOUT");

    const today = getTodayDateString();
    const todaySteps = getExecutionSteps(today);
    const settings = getSettings();
    const existing = getWorkoutLogs().find((log) => log.date === today);
    const completed = new Set(
      existing?.exerciseLogs.map((log) => log.exerciseId) ?? []
    );
    const firstOpenIndex = todaySteps.findIndex((step) => !completed.has(step.id));

    setDate(today);
    setSteps(todaySteps);
    setCompletedIds(completed);
    setCurrentIndex(firstOpenIndex >= 0 ? firstOpenIndex : 0);
    setDefaultRest(settings.defaultRestTimer);
    setState(existing?.isCompleted ? "COMPLETED" : "READY");
  }, []);

  const currentStep = steps[currentIndex];
  const currentPlan = date ? getRoutineDayForDate(date) : null;
  const completedCount = completedIds.size;
  const skippedCount = skippedIds.size;
  const finishedCount = completedCount + skippedCount;
  const progressPercentage =
    steps.length > 0 ? Math.round((finishedCount / steps.length) * 100) : 0;
  const completionRate =
    steps.length > 0 ? Math.round((completedCount / steps.length) * 100) : 0;
  const isTimedExercise = Boolean(currentStep?.exercise.durationSec);
  const restDuration = currentStep?.exercise.restSec ?? defaultRest;

  const estimatedCalories = useMemo(() => {
    if (!currentPlan) return 0;
    const minutes = elapsedMinutes || getRoutineEstimatedMinutes(currentPlan.day);
    const intensity = getRoutineDifficulty(currentPlan.day);
    return Math.round(minutes * (4 + intensity * 0.45));
  }, [currentPlan, elapsedMinutes]);

  const persistSession = useCallback(
    (
      nextCompleted: Set<string>,
      nextSkipped: Set<string>,
      forceDone = false,
      feltOverride?: number
    ) => {
      if (!currentPlan || !date) return;

      const now = new Date();
      const durationMinutes = Math.max(
        1,
        Math.round(
          (Date.now() - (startTimeRef.current ?? now).getTime()) / 60000
        )
      );
      const isCompleted =
        forceDone || nextCompleted.size + nextSkipped.size >= steps.length;
      const log: WorkoutLog = {
        id: `${date}-${currentPlan.routine.id}`,
        workoutDayId: currentPlan.routine.id,
        date,
        startedAt: (startTimeRef.current ?? now).toISOString(),
        completedAt: isCompleted ? now.toISOString() : undefined,
        exerciseLogs: steps
          .filter((step) => nextCompleted.has(step.id))
          .map((step) => ({
            exerciseId: step.id,
            setsCompleted: step.exercise.sets ?? 1,
            repsCompleted: step.exercise.reps
              ? [String(step.exercise.reps)]
              : [],
            durationSeconds: step.exercise.durationSec,
            completedAt: now.toISOString(),
            notes: step.exercise.name,
          })),
        isCompleted,
        durationMinutes,
        mood: feltOverride ?? feltDifficulty
          ? (Math.min(
              5,
              Math.ceil((feltOverride ?? feltDifficulty ?? 1) / 2)
            ) as WorkoutLog["mood"])
          : undefined,
        notes:
          nextSkipped.size > 0
            ? `Missed exercises: ${nextSkipped.size}`
            : undefined,
      };

      saveWorkoutLog(log);

      if (isCompleted) {
        setElapsedMinutes(durationMinutes);
      }
    },
    [currentPlan, date, feltDifficulty, steps]
  );

  const finishSession = useCallback(
    (nextCompleted = completedIds, nextSkipped = skippedIds) => {
      persistSession(nextCompleted, nextSkipped, true);
      setState("COMPLETED");
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([250, 120, 250]);
      }
    },
    [completedIds, persistSession, skippedIds]
  );

  const moveToNextExercise = useCallback(
    (nextCompleted = completedIds, nextSkipped = skippedIds) => {
      const nextIndex = currentIndex + 1;

      if (nextIndex >= steps.length) {
        finishSession(nextCompleted, nextSkipped);
        return;
      }

      setState("NEXT_EXERCISE");
      window.setTimeout(() => {
        setCurrentIndex(nextIndex);
        setRemaining(0);
        setState("IN_PROGRESS");
      }, 350);
    },
    [completedIds, currentIndex, finishSession, skippedIds, steps.length]
  );

  const startRest = useCallback(
    (nextCompleted: Set<string>, nextSkipped: Set<string>) => {
      if (currentIndex >= steps.length - 1 || restDuration <= 0) {
        moveToNextExercise(nextCompleted, nextSkipped);
        return;
      }

      setRemaining(restDuration);
      setState("RESTING");
    },
    [currentIndex, moveToNextExercise, restDuration, steps.length]
  );

  const completeExercise = useCallback(() => {
    if (!currentStep) return;

    setCompletedIds((previous) => {
      const next = new Set(previous);
      next.add(currentStep.id);
      persistSession(next, skippedIds);
      startRest(next, skippedIds);
      return next;
    });
  }, [currentStep, persistSession, skippedIds, startRest]);

  const skipExercise = useCallback(() => {
    if (!currentStep) return;

    setSkippedIds((previous) => {
      const next = new Set(previous);
      next.add(currentStep.id);
      persistSession(completedIds, next);
      startRest(completedIds, next);
      return next;
    });
  }, [completedIds, currentStep, persistSession, startRest]);

  const startExercise = useCallback(() => {
    if (!currentStep) return;

    if (!startTimeRef.current) {
      startTimeRef.current = new Date();
    }

    setState("IN_PROGRESS");
    setIsPaused(false);
    setRemaining(currentStep.exercise.durationSec ?? 0);
  }, [currentStep]);

  useEffect(() => {
    if (state !== "IN_PROGRESS" || !isTimedExercise || remaining > 0) return;
    setRemaining(currentStep?.exercise.durationSec ?? 0);
  }, [currentStep, isTimedExercise, remaining, state]);

  useEffect(() => {
    if (
      (state !== "IN_PROGRESS" && state !== "RESTING") ||
      isPaused ||
      remaining <= 0
    ) {
      return;
    }

    const interval = window.setInterval(() => {
      setRemaining((value) => {
        if (value <= 1) {
          window.clearInterval(interval);
          if (typeof navigator !== "undefined" && navigator.vibrate) {
            navigator.vibrate(180);
          }

          window.setTimeout(() => {
            if (state === "IN_PROGRESS" && isTimedExercise) {
              completeExercise();
            }
            if (state === "RESTING") {
              moveToNextExercise();
            }
          }, 0);

          return 0;
        }

        return value - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [
    completeExercise,
    isPaused,
    isTimedExercise,
    moveToNextExercise,
    remaining,
    state,
  ]);

  if (state === "LOADING_WORKOUT" || state === "IDLE") {
    return (
      <div className="flex min-h-svh items-center justify-center bg-dark-950 p-6 text-center text-slate-300">
        Loading workout...
      </div>
    );
  }

  if (!currentPlan || !currentStep || steps.length === 0) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-dark-950 p-6 text-center">
        <span className="text-5xl">🏀</span>
        <h2 className="text-xl font-bold text-slate-200">No routine today</h2>
        <p className="text-sm text-slate-400">
          Open the calendar to choose the next execution day.
        </p>
        <Link href="/calendar">
          <Button variant="secondary" size="md">
            View Calendar
          </Button>
        </Link>
      </div>
    );
  }

  if (state === "COMPLETED") {
    return (
      <div className="min-h-svh bg-dark-950 px-5 py-8 text-slate-100">
        <div className="mx-auto flex min-h-[calc(100svh-4rem)] max-w-md flex-col justify-center gap-6">
          <div className="text-center">
            <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 shadow-glow-green">
              <Trophy size={44} className="text-white" />
            </div>
            <p className="section-label mb-2">Finish Summary</p>
            <h1 className="text-4xl font-black">Session Complete</h1>
            <p className="mt-2 text-sm text-slate-400">
              The workout took over. Nice work.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <SummaryStat
              label="Total time"
              value={`~${elapsedMinutes || getRoutineEstimatedMinutes(currentPlan.day)}m`}
            />
            <SummaryStat label="Completed" value={`${completedCount}`} />
            <SummaryStat label="Missed" value={`${skippedCount}`} />
            <SummaryStat label="Rate" value={`${completionRate}%`} />
            <SummaryStat label="Calories" value={`~${estimatedCalories}`} />
          </div>

          <div className="rounded-3xl border border-white/5 bg-white/5 p-5">
            <p className="text-sm font-bold text-slate-200">
              How did it feel?
            </p>
            <div className="mt-4 grid grid-cols-5 gap-2">
              {Array.from({ length: 10 }, (_, index) => index + 1).map(
                (value) => (
                  <button
                    key={value}
                    onClick={() => {
                      setFeltDifficulty(value);
                      persistSession(completedIds, skippedIds, true, value);
                    }}
                    className={cn(
                      "rounded-xl py-2 text-sm font-bold transition-all",
                      feltDifficulty === value
                        ? "bg-brand-500 text-white shadow-glow"
                        : "bg-white/5 text-slate-400 hover:bg-white/10"
                    )}
                  >
                    {value}
                  </button>
                )
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Link href="/">
              <Button variant="primary" size="xl">
                <Trophy size={18} /> FINISH WORKOUT
              </Button>
            </Link>
            <button
              onClick={() => {
                setCurrentIndex(0);
                setState("READY");
              }}
              className="btn-ghost flex items-center justify-center gap-2 py-3"
            >
              <RotateCcw size={16} /> Review Session
            </button>
          </div>
        </div>
      </div>
    );
  }

  const displayTimer =
    state === "RESTING"
      ? remaining
      : isTimedExercise
      ? remaining || currentStep.exercise.durationSec || 0
      : 0;

  return (
    <div className="min-h-svh overflow-hidden bg-dark-950 text-slate-100">
      <div className="mx-auto flex min-h-svh max-w-md flex-col px-5 pb-6 pt-7">
        <header className="flex items-center justify-between gap-3">
          <button
            onClick={() => setIsPaused((value) => !value)}
            className={cn(
              "rounded-full p-2 transition-colors",
              isPaused
                ? "bg-brand-500 text-white"
                : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
            )}
            aria-label={isPaused ? "Resume workout" : "Pause workout"}
          >
            {isPaused ? <Play size={20} /> : <Pause size={20} />}
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-center text-xs font-semibold uppercase tracking-widest text-slate-500">
              {currentPlan.day.sessions[0]?.title}
            </p>
            <div className="mt-2 h-1.5 rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-brand-500 transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
          <span className="min-w-10 text-right text-sm font-bold text-slate-500">
            {currentIndex + 1}/{steps.length}
          </span>
        </header>

        <main className="flex flex-1 flex-col justify-center py-7">
          {state === "READY" ? (
            <ReadyPanel
              title={currentPlan.day.sessions[0]?.title ?? currentPlan.routine.name}
              exercises={steps.length}
              duration={getRoutineEstimatedMinutes(currentPlan.day)}
              difficulty={getRoutineDifficulty(currentPlan.day)}
              onStart={startExercise}
            />
          ) : state === "RESTING" ? (
            <TimerPanel
              eyebrow="Rest"
              title={isPaused ? "Paused" : "Recover"}
              helper={
                isPaused
                  ? "Paused. Press play when you are ready."
                  : "Breathe. Reset posture. Next exercise loads automatically."
              }
              seconds={displayTimer}
              accent="text-teal-300"
            />
          ) : state === "NEXT_EXERCISE" ? (
            <div className="text-center">
              <p className="section-label mb-3">Next Exercise</p>
              <h1 className="text-4xl font-black">Loading...</h1>
            </div>
          ) : (
            <ExercisePanel
              step={currentStep}
              seconds={displayTimer}
              isTimed={isTimedExercise}
              state={state}
              isPaused={isPaused}
              onStart={startExercise}
              onSetTimer={setRemaining}
            />
          )}
        </main>

        {state !== "READY" && state !== "NEXT_EXERCISE" && (
          <footer className="flex flex-col gap-3">
            {state === "IN_PROGRESS" && !isTimedExercise && (
              <Button variant="primary" size="xl" onClick={completeExercise}>
                <Check size={20} /> Done
              </Button>
            )}
            {state === "IN_PROGRESS" && isTimedExercise && (
              <Button variant="secondary" size="xl" onClick={completeExercise}>
                <Check size={20} /> Finish Now
              </Button>
            )}
            {state === "RESTING" && (
              <Button
                variant="primary"
                size="xl"
                onClick={() => moveToNextExercise()}
              >
                Next Exercise <ChevronRight size={20} />
              </Button>
            )}
            {state === "IN_PROGRESS" && (
              <button
                onClick={skipExercise}
                className="flex items-center justify-center gap-2 rounded-2xl py-4 text-sm font-bold text-slate-500 transition-colors hover:bg-white/5 hover:text-slate-300"
              >
                <SkipForward size={16} /> Skip
              </button>
            )}
          </footer>
        )}
      </div>
    </div>
  );
}

function ReadyPanel({
  title,
  exercises,
  duration,
  difficulty,
  onStart,
}: {
  title: string;
  exercises: number;
  duration: number;
  difficulty: number;
  onStart: () => void;
}) {
  return (
    <div className="text-center">
      <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-brand-500/15 text-brand-400">
        <Flame size={42} />
      </div>
      <p className="section-label mb-3">Ready</p>
      <h1 className="text-5xl font-black leading-none">{title}</h1>
      <div className="my-8 grid grid-cols-3 gap-2">
        <SummaryStat label="Exercises" value={`${exercises}`} />
        <SummaryStat label="Time" value={formatDuration(duration)} />
        <SummaryStat label="Level" value={`${difficulty}/10`} />
      </div>
      <Button variant="primary" size="xl" onClick={onStart}>
        START WORKOUT
      </Button>
    </div>
  );
}

function ExercisePanel({
  step,
  seconds,
  isTimed,
  state,
  isPaused,
  onStart,
  onSetTimer,
}: {
  step: ExecutionStep;
  seconds: number;
  isTimed: boolean;
  state: ExecutionState;
  isPaused: boolean;
  onStart: () => void;
  onSetTimer: (seconds: number) => void;
}) {
  return (
    <div className="flex flex-col gap-8">
      <div className="text-center">
        <div className="mb-4 flex flex-wrap justify-center gap-2">
          <Badge variant="default">{step.sessionTitle}</Badge>
          <Badge variant={isTimed ? "info" : "warning"}>
            {getExercisePrescription(step.exercise)}
          </Badge>
        </div>
        <h1 className="text-5xl font-black leading-none tracking-normal">
          {step.exercise.name}
        </h1>
        <p className="mx-auto mt-5 max-w-sm text-base leading-relaxed text-slate-400">
          {step.exercise.instruction ??
            "Move with control and keep the quality high."}
        </p>
        {step.exercise.coachTips && (
          <div className="mx-auto mt-5 max-w-sm rounded-2xl border border-brand-500/20 bg-brand-500/10 p-4 text-left">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-300">
              Coach Tip
            </p>
            <p className="mt-1 text-sm leading-relaxed text-slate-300">
              {step.exercise.coachTips}
            </p>
          </div>
        )}
      </div>

      {isTimed ? (
        <TimerPanel
          eyebrow={state === "IN_PROGRESS" ? "Work Timer" : "Timed Exercise"}
          title={isPaused ? "Paused" : state === "IN_PROGRESS" ? "Go" : "Ready"}
          helper={
            isPaused
              ? "Paused. Press play to continue the countdown."
              : "Timer starts automatically. Stay smooth until it ends."
          }
          seconds={seconds}
          accent="text-brand-300"
        />
      ) : (
        <div className="rounded-3xl border border-white/5 bg-white/5 p-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            Prescription
          </p>
          <p className="mt-2 text-5xl font-black">
            {step.exercise.sets ?? 1} x {step.exercise.reps ?? "Go"}
          </p>
          <p className="mt-2 text-sm text-slate-500">Press Done when complete.</p>
        </div>
      )}

      {isTimed && state !== "IN_PROGRESS" && (
        <Button variant="primary" size="xl" onClick={onStart}>
          <Timer size={20} /> Start Timer
        </Button>
      )}

      {isTimed && (
        <div className="grid grid-cols-5 gap-2">
          {TIMER_PRESETS.map((preset) => (
            <button
              key={preset}
              onClick={() => onSetTimer(preset)}
              className="rounded-xl bg-white/5 py-2 text-xs font-bold text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
            >
              {preset}s
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function TimerPanel({
  eyebrow,
  title,
  helper,
  seconds,
  accent,
}: {
  eyebrow: string;
  title: string;
  helper: string;
  seconds: number;
  accent: string;
}) {
  return (
    <div className="rounded-[2rem] border border-white/5 bg-white/5 p-6 text-center">
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
        {eyebrow}
      </p>
      <p className={cn("mt-4 text-8xl font-black tabular-nums", accent)}>
        {seconds > 0 ? formatTimer(seconds) : title}
      </p>
      <p className="mx-auto mt-4 max-w-xs text-sm leading-relaxed text-slate-500">
        {helper}
      </p>
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/5 p-4 text-center">
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-xl font-black text-slate-100">{value}</p>
    </div>
  );
}
