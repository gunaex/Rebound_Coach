"use client";

import { useState, useEffect } from "react";
import { Flame, Trophy, Zap, Lock, Star } from "lucide-react";
import {
  getWorkoutLogs,
  getUserProgress,
  calculateStreak,
  getCompletionRate,
} from "@/lib/storage";
import { getAllExercises } from "@/lib/workout";
import { ProgressRing } from "@/components/ui/ProgressRing";
import type { UserProgress, WorkoutLog, Exercise } from "@/types";
import { cn } from "@/lib/utils";

const LEVELS = [
  { id: "foundation", label: "Foundation", icon: "🌱", color: "from-slate-400 to-slate-600" },
  { id: "stability", label: "Stability", icon: "🛡️", color: "from-emerald-400 to-teal-600" },
  { id: "strength", label: "Strength", icon: "💪", color: "from-blue-400 to-indigo-600" },
  { id: "athletic", label: "Athletic", icon: "⚡", color: "from-violet-400 to-purple-600" },
  { id: "elite", label: "Elite", icon: "🏆", color: "from-amber-400 to-orange-600" },
];

const LEVEL_INDEX: Record<string, number> = {
  foundation: 0,
  stability: 1,
  strength: 2,
  athletic: 3,
  elite: 4,
};

export function ProgressPageClient() {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [streak, setStreak] = useState({ current: 0, longest: 0 });
  const [completionRate, setCompletionRate] = useState(0);
  const [exercises, setExercises] = useState<Exercise[]>([]);

  useEffect(() => {
    const userProgress = getUserProgress();
    const workoutLogs = getWorkoutLogs();
    const streakData = calculateStreak(workoutLogs);
    const rate = getCompletionRate(workoutLogs, 30);
    const allExercises = getAllExercises();

    setProgress(userProgress);
    setLogs(workoutLogs);
    setStreak(streakData);
    setCompletionRate(rate);
    setExercises(allExercises);
  }, []);

  const totalCompleted = logs.filter((l) => l.isCompleted).length;
  const currentLevelIndex = LEVEL_INDEX[progress?.currentLevel ?? "foundation"];
  const currentLevel = LEVELS[currentLevelIndex];
  const nextLevel = LEVELS[currentLevelIndex + 1];

  // XP to simulate progress within level (based on workouts)
  const xpForLevel = [5, 10, 15, 20, 999];
  const xpInCurrentLevel = totalCompleted - [0, 5, 15, 30, 50][currentLevelIndex];
  const xpNeeded = xpForLevel[currentLevelIndex];
  const levelProgress = Math.min(
    Math.round((Math.max(0, xpInCurrentLevel) / xpNeeded) * 100),
    100
  );

  // Skills from exercises
  const skills = exercises.filter((ex) => ex.skillName);
  const unlockedSkills = skills.filter(
    (ex) =>
      LEVEL_INDEX[ex.unlockLevel] <=
      LEVEL_INDEX[progress?.currentLevel ?? "foundation"]
  );

  return (
    <div className="page">
      <div className="px-4 pt-12 pb-4 flex flex-col gap-6">
        {/* Header */}
        <h1 className="text-2xl font-black text-slate-100">Progress</h1>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              icon: <Flame size={18} className="text-brand-400" />,
              value: streak.current,
              label: "Streak",
              bg: "bg-brand-500/10",
            },
            {
              icon: <Trophy size={18} className="text-amber-400" />,
              value: totalCompleted,
              label: "Workouts",
              bg: "bg-amber-500/10",
            },
            {
              icon: <Star size={18} className="text-purple-400" />,
              value: streak.longest,
              label: "Best Streak",
              bg: "bg-purple-500/10",
            },
          ].map(({ icon, value, label, bg }) => (
            <div key={label} className="card p-4 flex flex-col items-center gap-1.5 text-center">
              <div className={`w-8 h-8 rounded-xl ${bg} flex items-center justify-center`}>
                {icon}
              </div>
              <p className="text-2xl font-black text-slate-100">{value}</p>
              <p className="text-[11px] text-slate-500 font-semibold">{label}</p>
            </div>
          ))}
        </div>

        {/* Completion ring + Level */}
        <div className="card p-5 flex items-center gap-5">
          <ProgressRing percentage={completionRate} size={100} strokeWidth={8}>
            <span className="text-xl font-black text-slate-100">{completionRate}%</span>
          </ProgressRing>
          <div className="flex-1">
            <p className="section-label mb-1">30-Day Completion</p>
            <p className="text-slate-300 text-sm">
              {completionRate >= 80
                ? "Outstanding consistency! 🔥"
                : completionRate >= 50
                ? "Keep pushing, you're building the habit!"
                : "Start your streak today — one workout changes everything."}
            </p>
          </div>
        </div>

        {/* Level Progress */}
        <div className="card p-5 flex flex-col gap-4">
          <p className="section-label">Level Journey</p>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${currentLevel.color} flex items-center justify-center text-xl flex-shrink-0`}>
              {currentLevel.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-200 font-bold">{currentLevel.label}</span>
                {nextLevel && (
                  <span className="text-slate-500 text-xs">{nextLevel.label} →</span>
                )}
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${currentLevel.color} transition-all duration-700`}
                  style={{ width: `${levelProgress}%` }}
                />
              </div>
              <p className="text-slate-500 text-xs mt-1">
                {Math.max(0, xpInCurrentLevel)}/{xpNeeded} workouts to {nextLevel?.label ?? "Elite"}
              </p>
            </div>
          </div>

          {/* Level dots */}
          <div className="flex items-center gap-2">
            {LEVELS.map((level, i) => (
              <div key={level.id} className="flex flex-col items-center gap-1 flex-1">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all duration-200",
                    i <= currentLevelIndex
                      ? `bg-gradient-to-br ${level.color}`
                      : "bg-white/5 grayscale opacity-40"
                  )}
                >
                  {level.icon}
                </div>
                <span className={cn("text-[9px] font-semibold", i <= currentLevelIndex ? "text-slate-400" : "text-slate-700")}>
                  {level.label.slice(0, 3)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Skill Cards */}
        <div>
          <p className="section-label mb-3">Skill Cards</p>
          <div className="grid grid-cols-2 gap-3">
            {skills.map((exercise) => {
              const unlocked =
                LEVEL_INDEX[exercise.unlockLevel] <=
                LEVEL_INDEX[progress?.currentLevel ?? "foundation"];
              const isLegendary = exercise.difficulty === "legendary";

              return (
                <div
                  key={exercise.id}
                  className={cn(
                    "rounded-2xl p-4 border flex flex-col gap-2 transition-all duration-200",
                    unlocked
                      ? isLegendary
                        ? "bg-gradient-to-br from-purple-950/60 to-pink-950/60 border-purple-500/30"
                        : "card border-white/5"
                      : "bg-dark-800/50 border-white/5 opacity-50"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">
                      {exercise.category === "strength"
                        ? "💪"
                        : exercise.category === "cardio"
                        ? "🏃"
                        : exercise.category === "core"
                        ? "🛡️"
                        : exercise.category === "power"
                        ? "⚡"
                        : exercise.category === "stability"
                        ? "⚖️"
                        : "🔄"}
                    </span>
                    {unlocked ? (
                      <span className={cn("text-xs font-bold", isLegendary ? "text-purple-400" : "text-emerald-400")}>
                        {isLegendary ? "✦ Legendary" : "Unlocked"}
                      </span>
                    ) : (
                      <Lock size={14} className="text-slate-600" />
                    )}
                  </div>
                  <div>
                    <p
                      className={cn(
                        "text-sm font-bold leading-tight",
                        unlocked
                          ? isLegendary
                            ? "text-gradient-legendary"
                            : "text-slate-100"
                          : "text-slate-600"
                      )}
                    >
                      {exercise.skillName}
                    </p>
                    {unlocked && (
                      <p className="text-xs text-slate-500 mt-0.5 leading-tight">
                        {exercise.skillDescription}
                      </p>
                    )}
                    {!unlocked && (
                      <p className="text-xs text-slate-700 mt-0.5">
                        Reach {exercise.unlockLevel} to unlock
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
