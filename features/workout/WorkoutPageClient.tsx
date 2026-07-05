"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Trophy,
  RotateCcw,
} from "lucide-react";
import {
  getTodayWorkout,
  getExercisesForWorkout,
  getTodayDateString,
} from "@/lib/workout";
import {
  getWorkoutLogs,
  saveWorkoutLog,
  getSettings,
} from "@/lib/storage";
import { ExerciseCard } from "./ExerciseCard";
import { RestTimer } from "./RestTimer";
import { WorkoutTimer } from "./WorkoutTimer";
import { Button } from "@/components/ui/Button";
import type { WorkoutDay, Exercise, WorkoutLog, ExerciseLog } from "@/types";
import { cn } from "@/lib/utils";

export function WorkoutPageClient() {
  const [workout, setWorkout] = useState<WorkoutDay | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [showWorkoutTimer, setShowWorkoutTimer] = useState(false);
  const [restDuration, setRestDuration] = useState(90);
  const [timerDuration, setTimerDuration] = useState(60);
  const [autoStartRestTimer, setAutoStartRestTimer] = useState(true);
  const [workoutComplete, setWorkoutComplete] = useState(false);
  const startTimeRef = useRef<Date | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Touch swipe state
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  useEffect(() => {
    const todayWorkout = getTodayWorkout();
    if (!todayWorkout) return;
    setWorkout(todayWorkout);
    const exs = getExercisesForWorkout(todayWorkout);
    setExercises(exs);

    // Load any existing log for today
    const todayStr = getTodayDateString();
    const logs = getWorkoutLogs();
    const existing = logs.find((l) => l.date === todayStr && l.workoutDayId === todayWorkout.id);
    if (existing) {
      const completedSet = new Set(existing.exerciseLogs.map((el) => el.exerciseId));
      setCompletedIds(completedSet);
      if (existing.isCompleted) setWorkoutComplete(true);
    }

    startTimeRef.current = new Date();

    const settings = getSettings();
    setRestDuration(settings.defaultRestTimer);
    setAutoStartRestTimer(settings.autoStartRestTimer);
  }, []);

  const handleComplete = useCallback(
    (exerciseId: string, exerciseRest: number) => {
      setCompletedIds((prev) => {
        const next = new Set(prev);
        next.add(exerciseId);

        // Auto-save log
        if (workout) {
          const todayStr = getTodayDateString();
          const logs = getWorkoutLogs();
          const existing = logs.find(
            (l) => l.date === todayStr && l.workoutDayId === workout.id
          );

          const exerciseLog: ExerciseLog = {
            exerciseId,
            setsCompleted: exercises.find((e) => e.id === exerciseId)?.sets ?? 0,
            repsCompleted: [],
            completedAt: new Date().toISOString(),
          };
          const durationMinutes = Math.max(
            1,
            Math.round(
              (Date.now() - (startTimeRef.current ?? new Date()).getTime()) /
                60000
            )
          );

          const updatedLog: WorkoutLog = existing
            ? {
                ...existing,
                exerciseLogs: [
                  ...existing.exerciseLogs.filter(
                    (el) => el.exerciseId !== exerciseId
                  ),
                  exerciseLog,
                ],
                isCompleted: next.size === exercises.length,
                durationMinutes,
                completedAt:
                  next.size === exercises.length
                    ? new Date().toISOString()
                    : undefined,
              }
            : {
                id: `${todayStr}-${workout.id}`,
                workoutDayId: workout.id,
                date: todayStr,
                startedAt: (startTimeRef.current ?? new Date()).toISOString(),
                exerciseLogs: [exerciseLog],
                isCompleted: next.size === exercises.length,
                durationMinutes,
                completedAt:
                  next.size === exercises.length
                    ? new Date().toISOString()
                    : undefined,
              };

          saveWorkoutLog(updatedLog);

          if (next.size === exercises.length) {
            setWorkoutComplete(true);
          }
        }

        return next;
      });

      const hasNextExercise = currentIndex < exercises.length - 1;
      if (autoStartRestTimer && hasNextExercise) {
        setRestDuration(exerciseRest);
        setShowRestTimer(true);
      }

      if (hasNextExercise) {
        setTimeout(() => setCurrentIndex((i) => i + 1), 400);
      }
    },
    [workout, exercises, currentIndex, autoStartRestTimer]
  );

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0 && currentIndex < exercises.length - 1) {
        setCurrentIndex((i) => i + 1);
      } else if (diff < 0 && currentIndex > 0) {
        setCurrentIndex((i) => i - 1);
      }
    }
  };

  if (!workout || exercises.length === 0) {
    return (
      <div className="page flex flex-col items-center justify-center min-h-svh gap-4 p-6 text-center">
        <span className="text-5xl">😴</span>
        <h2 className="text-xl font-bold text-slate-200">Rest Day</h2>
        <p className="text-slate-400 text-sm">
          No active workout today. Check back tomorrow!
        </p>
        <Link href="/">
          <Button variant="secondary" size="md">
            Go Home
          </Button>
        </Link>
      </div>
    );
  }

  if (workoutComplete) {
    const duration = startTimeRef.current
      ? Math.round(
          (Date.now() - startTimeRef.current.getTime()) / 60000
        )
      : workout.estimatedDuration;

    return (
      <div className="page flex flex-col items-center justify-center min-h-svh gap-6 p-6 text-center animate-fade-in">
        <div className="animate-bounce-in">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center mx-auto mb-4 shadow-glow-green">
            <Trophy size={44} className="text-white" />
          </div>
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-100 mb-2">
            Workout Complete!
          </h1>
          <p className="text-slate-400">
            {completedIds.size} exercises · ~{duration} minutes
          </p>
        </div>
        <div className="flex flex-col gap-2 w-full max-w-xs">
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
            <RotateCcw size={16} /> Review Exercises
          </button>
        </div>
      </div>
    );
  }

  const currentExercise = exercises[currentIndex];

  return (
    <div className="page">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-4">
        <Link
          href="/"
          className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <ChevronLeft size={20} />
        </Link>
        <div className="flex-1">
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest">
            {workout.name}
          </p>
          <div className="flex items-center gap-1 mt-1">
            {exercises.map((ex, i) => (
              <div
                key={ex.id}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-all duration-300",
                  completedIds.has(ex.id)
                    ? "bg-emerald-500"
                    : i === currentIndex
                    ? "bg-brand-500"
                    : "bg-white/10"
                )}
              />
            ))}
          </div>
        </div>
        <span className="text-sm font-bold text-slate-400">
          {currentIndex + 1}/{exercises.length}
        </span>
      </div>

      {/* Exercise Card (swipeable) */}
      <div
        className="px-4 swipe-container"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        ref={containerRef}
      >
        <ExerciseCard
          key={currentExercise.id}
          exercise={currentExercise}
          index={currentIndex}
          total={exercises.length}
          isCompleted={completedIds.has(currentExercise.id)}
          onComplete={() =>
            handleComplete(currentExercise.id, currentExercise.rest)
          }
          onStartTimer={() => {
            setTimerDuration(currentExercise.timer ?? 60);
            setShowWorkoutTimer(true);
          }}
        />
      </div>

      {/* Navigation arrows */}
      <div className="flex items-center justify-between px-4 py-4 gap-3">
        <button
          onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
          disabled={currentIndex === 0}
          className="flex items-center gap-1 px-4 py-2.5 rounded-xl bg-white/5 text-slate-400 disabled:opacity-30 hover:bg-white/10 hover:text-white transition-colors"
        >
          <ChevronLeft size={18} /> Prev
        </button>
        <div className="flex gap-1.5">
          {exercises.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-200",
                i === currentIndex
                  ? "bg-brand-500 w-4"
                  : completedIds.has(exercises[i].id)
                  ? "bg-emerald-500"
                  : "bg-white/20"
              )}
            />
          ))}
        </div>
        <button
          onClick={() =>
            setCurrentIndex((i) => Math.min(exercises.length - 1, i + 1))
          }
          disabled={currentIndex === exercises.length - 1}
          className="flex items-center gap-1 px-4 py-2.5 rounded-xl bg-white/5 text-slate-400 disabled:opacity-30 hover:bg-white/10 hover:text-white transition-colors"
        >
          Next <ChevronRight size={18} />
        </button>
      </div>

      {/* Rest Timer Overlay */}
      <RestTimer
        duration={restDuration}
        isVisible={showRestTimer}
        onComplete={() => setShowRestTimer(false)}
        onSkip={() => setShowRestTimer(false)}
      />

      {/* Workout Timer Overlay */}
      <WorkoutTimer
        initialDuration={timerDuration}
        isVisible={showWorkoutTimer}
        onComplete={() => setShowWorkoutTimer(false)}
        onClose={() => setShowWorkoutTimer(false)}
      />
    </div>
  );
}
