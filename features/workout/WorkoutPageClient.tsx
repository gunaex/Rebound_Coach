"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Dumbbell,
  Play,
  RotateCcw,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { RestTimer } from "./RestTimer";
import { WorkoutTimer } from "./WorkoutTimer";
import {
  getExercisePrescription,
  getExecutionSteps,
  getRoutineDayForDate,
  getRoutineDifficulty,
  getRoutineEstimatedMinutes,
} from "@/lib/routines";
import { formatDuration, getTodayDateString } from "@/lib/workout";
import { getSettings, getWorkoutLogs, saveWorkoutLog } from "@/lib/storage";
import type { ExecutionStep, WorkoutLog } from "@/types";
import { cn } from "@/lib/utils";

export function WorkoutPageClient() {
  const [date, setDate] = useState("");
  const [steps, setSteps] = useState<ExecutionStep[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [completedSets, setCompletedSets] = useState(0);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [showWorkoutTimer, setShowWorkoutTimer] = useState(false);
  const [restDuration, setRestDuration] = useState(60);
  const [timerDuration, setTimerDuration] = useState(60);
  const [autoStartRestTimer, setAutoStartRestTimer] = useState(true);
  const [workoutComplete, setWorkoutComplete] = useState(false);
  const [elapsedMinutes, setElapsedMinutes] = useState(0);
  const startTimeRef = useRef<Date | null>(null);

  useEffect(() => {
    const today = getTodayDateString();
    const todaySteps = getExecutionSteps(today);
    const settings = getSettings();
    const logs = getWorkoutLogs();
    const existing = logs.find((log) => log.date === today);
    const completed = new Set(
      existing?.exerciseLogs.map((log) => log.exerciseId) ?? []
    );
    const firstOpenIndex = todaySteps.findIndex((step) => !completed.has(step.id));

    setDate(today);
    setSteps(todaySteps);
    setCompletedIds(completed);
    setCurrentIndex(firstOpenIndex >= 0 ? firstOpenIndex : 0);
    setWorkoutComplete(existing?.isCompleted ?? false);
    setRestDuration(settings.defaultRestTimer);
    setAutoStartRestTimer(settings.autoStartRestTimer);
    startTimeRef.current = new Date();
  }, []);

  const currentStep = steps[currentIndex];
  const currentPlan = date ? getRoutineDayForDate(date) : null;
  const totalSets = currentStep?.exercise.sets ?? 1;
  const isCurrentCompleted = currentStep
    ? completedIds.has(currentStep.id)
    : false;
  const progressPercentage =
    steps.length > 0 ? Math.round((completedIds.size / steps.length) * 100) : 0;

  const saveExecutionLog = useCallback(
    (nextCompletedIds: Set<string>) => {
      if (!currentPlan || !date) return;

      const nextExerciseLogs = steps
        .filter((step) => nextCompletedIds.has(step.id))
        .map((step) => ({
          exerciseId: step.id,
          setsCompleted: step.exercise.sets ?? 1,
          repsCompleted: step.exercise.reps
            ? [String(step.exercise.reps)]
            : [],
          durationSeconds: step.exercise.durationSec,
          completedAt: new Date().toISOString(),
          notes: step.exercise.name,
        }));
      const isCompleted = nextCompletedIds.size === steps.length;
      const durationMinutes = Math.max(
        1,
        Math.round(
          (Date.now() - (startTimeRef.current ?? new Date()).getTime()) / 60000
        )
      );
      const log: WorkoutLog = {
        id: `${date}-${currentPlan.routine.id}`,
        workoutDayId: currentPlan.routine.id,
        date,
        startedAt: (startTimeRef.current ?? new Date()).toISOString(),
        completedAt: isCompleted ? new Date().toISOString() : undefined,
        exerciseLogs: nextExerciseLogs,
        isCompleted,
        durationMinutes,
      };

      saveWorkoutLog(log);

      if (isCompleted) {
        setElapsedMinutes(durationMinutes);
        setWorkoutComplete(true);
      }
    },
    [currentPlan, date, steps]
  );

  const completeCurrentSet = useCallback(() => {
    if (!currentStep || isCurrentCompleted) return;

    const nextSetCount = completedSets + 1;
    const restSec = currentStep.exercise.restSec ?? restDuration;

    if (nextSetCount < totalSets) {
      setCompletedSets(nextSetCount);
      if (autoStartRestTimer && restSec > 0) {
        setRestDuration(restSec);
        setShowRestTimer(true);
      }
      return;
    }

    setCompletedIds((previous) => {
      const next = new Set(previous);
      next.add(currentStep.id);
      saveExecutionLog(next);
      return next;
    });

    setCompletedSets(0);

    const hasNextStep = currentIndex < steps.length - 1;
    if (hasNextStep) {
      if (autoStartRestTimer && restSec > 0) {
        setRestDuration(restSec);
        setShowRestTimer(true);
      }
      setTimeout(() => setCurrentIndex((index) => index + 1), 350);
    }
  }, [
    autoStartRestTimer,
    completedSets,
    currentIndex,
    currentStep,
    isCurrentCompleted,
    restDuration,
    saveExecutionLog,
    steps.length,
    totalSets,
  ]);

  function goToStep(index: number) {
    setCurrentIndex(index);
    setCompletedSets(0);
  }

  if (!currentPlan || steps.length === 0) {
    return (
      <div className="page flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
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

  if (workoutComplete) {
    return (
      <div className="page flex min-h-svh flex-col items-center justify-center gap-6 p-6 text-center animate-fade-in">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-glow-green">
          <Trophy size={44} className="text-white" />
        </div>
        <div>
          <h1 className="mb-2 text-3xl font-black text-slate-100">
            Execution Complete
          </h1>
          <p className="text-slate-400">
            {steps.length} exercises · ~
            {elapsedMinutes || getRoutineEstimatedMinutes(currentPlan.day)} minutes
          </p>
        </div>
        <div className="flex w-full max-w-xs flex-col gap-2">
          <Link href="/progress">
            <Button variant="primary" size="xl">
              <Trophy size={18} /> View Progress
            </Button>
          </Link>
          <button
            onClick={() => {
              setWorkoutComplete(false);
              setCurrentIndex(0);
            }}
            className="btn-ghost flex items-center justify-center gap-2 py-3"
          >
            <RotateCcw size={16} /> Review Steps
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="px-4 pt-12 pb-4">
        <div className="mb-5 flex items-center gap-3">
          <Link
            href="/"
            className="rounded-xl bg-white/5 p-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            <ChevronLeft size={20} />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              {currentPlan.day.sessions[0]?.title}
            </p>
            <div className="mt-2 h-1.5 rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-brand-500 transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
          <span className="text-sm font-bold text-slate-400">
            {currentIndex + 1}/{steps.length}
          </span>
        </div>

        <div className="mb-4 grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-white/5 p-3">
            <Clock size={16} className="mb-2 text-brand-400" />
            <p className="text-xs text-slate-500">Duration</p>
            <p className="text-sm font-bold text-slate-100">
              {formatDuration(getRoutineEstimatedMinutes(currentPlan.day))}
            </p>
          </div>
          <div className="rounded-2xl bg-white/5 p-3">
            <Dumbbell size={16} className="mb-2 text-brand-400" />
            <p className="text-xs text-slate-500">Difficulty</p>
            <p className="text-sm font-bold text-slate-100">
              {getRoutineDifficulty(currentPlan.day)}/10
            </p>
          </div>
          <div className="rounded-2xl bg-white/5 p-3">
            <Check size={16} className="mb-2 text-emerald-400" />
            <p className="text-xs text-slate-500">Done</p>
            <p className="text-sm font-bold text-slate-100">
              {completedIds.size}/{steps.length}
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-white/5 bg-dark-800 shadow-float">
          <div className="border-b border-white/5 p-5">
            <div className="mb-3 flex flex-wrap gap-2">
              <Badge variant="default">{currentStep.sessionTitle}</Badge>
              <Badge variant="info">
                {getExercisePrescription(currentStep.exercise)}
              </Badge>
              {currentStep.exercise.difficulty && (
                <Badge variant="warning">
                  D{currentStep.exercise.difficulty}
                </Badge>
              )}
            </div>
            <h1 className="text-3xl font-black leading-tight text-slate-100">
              {currentStep.exercise.name}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              {currentStep.exercise.instruction ??
                "Move with control and keep the quality high."}
            </p>
          </div>

          <div className="p-5">
            <div className="mb-5 grid grid-cols-3 gap-2">
              <div className="rounded-2xl bg-white/5 px-3 py-4 text-center">
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Sets
                </p>
                <p className="mt-1 text-2xl font-black text-slate-100">
                  {completedSets}/{totalSets}
                </p>
              </div>
              <div className="rounded-2xl bg-white/5 px-3 py-4 text-center">
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Work
                </p>
                <p className="mt-1 text-xl font-black text-slate-100">
                  {currentStep.exercise.durationSec
                    ? `${currentStep.exercise.durationSec}s`
                    : currentStep.exercise.reps
                    ? `${currentStep.exercise.reps}`
                    : "Go"}
                </p>
              </div>
              <div className="rounded-2xl bg-white/5 px-3 py-4 text-center">
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Rest
                </p>
                <p className="mt-1 text-xl font-black text-slate-100">
                  {currentStep.exercise.restSec ?? restDuration}s
                </p>
              </div>
            </div>

            {currentStep.exercise.durationSec && !isCurrentCompleted && (
              <Button
                variant="secondary"
                size="lg"
                className="mb-3 w-full"
                onClick={() => {
                  setTimerDuration(currentStep.exercise.durationSec ?? 60);
                  setShowWorkoutTimer(true);
                }}
              >
                <Play size={18} /> Start Work Timer
              </Button>
            )}

            <Button
              variant={isCurrentCompleted ? "secondary" : "primary"}
              size="xl"
              onClick={completeCurrentSet}
              disabled={isCurrentCompleted}
            >
              {isCurrentCompleted ? (
                <>
                  <Check size={18} /> Step Complete
                </>
              ) : completedSets + 1 < totalSets ? (
                <>
                  Complete Set {completedSets + 1}
                  <ChevronRight size={18} />
                </>
              ) : (
                <>
                  Complete Exercise
                  <ChevronRight size={18} />
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <button
            onClick={() => goToStep(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
            className="flex items-center gap-1 rounded-xl bg-white/5 px-4 py-2.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30"
          >
            <ChevronLeft size={18} /> Prev
          </button>
          <div className="flex gap-1.5">
            {steps.map((step, index) => (
              <button
                key={step.id}
                onClick={() => goToStep(index)}
                className={cn(
                  "h-2 w-2 rounded-full transition-all duration-200",
                  index === currentIndex
                    ? "w-4 bg-brand-500"
                    : completedIds.has(step.id)
                    ? "bg-emerald-500"
                    : "bg-white/20"
                )}
              />
            ))}
          </div>
          <button
            onClick={() => goToStep(Math.min(steps.length - 1, currentIndex + 1))}
            disabled={currentIndex === steps.length - 1}
            className="flex items-center gap-1 rounded-xl bg-white/5 px-4 py-2.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30"
          >
            Next <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <RestTimer
        duration={restDuration}
        isVisible={showRestTimer}
        onComplete={() => setShowRestTimer(false)}
        onSkip={() => setShowRestTimer(false)}
      />

      <WorkoutTimer
        initialDuration={timerDuration}
        isVisible={showWorkoutTimer}
        onComplete={() => setShowWorkoutTimer(false)}
        onClose={() => setShowWorkoutTimer(false)}
      />
    </div>
  );
}
