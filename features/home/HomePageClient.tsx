"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Flame,
  Clock,
  ChevronRight,
  Zap,
  Trophy,
  Dumbbell,
  Star,
} from "lucide-react";
import {
  getTodayDisplayString,
  getTodayDateString,
  formatDuration,
} from "@/lib/workout";
import {
  getRoutineDifficulty,
  getRoutineEstimatedMinutes,
  getTodayRoutineDay,
} from "@/lib/routines";
import {
  getWorkoutLogs,
  getUserProgress,
  calculateStreak,
} from "@/lib/storage";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { Routine, RoutineDay, UserProgress, WorkoutLog } from "@/types";

const QUOTES = [
  "Sweat now. Perform later.",
  "Big dreams require hard work.",
  "Every rep is a rep closer.",
  "Champions train when nobody watches.",
  "Earn your rest.",
  "Discipline beats motivation every time.",
  "The court rewards consistency.",
  "No shortcuts to the top.",
  "Level up. Every. Single. Day.",
  "Your body can do it. Trust the process.",
];

const LEVEL_LABELS: Record<string, string> = {
  foundation: "Foundation",
  stability: "Stability",
  strength: "Strength",
  athletic: "Athletic",
  elite: "Elite",
};

const LEVEL_COLORS: Record<string, string> = {
  foundation: "from-slate-400 to-slate-600",
  stability: "from-emerald-400 to-teal-600",
  strength: "from-blue-400 to-indigo-600",
  athletic: "from-violet-400 to-purple-600",
  elite: "from-amber-400 to-orange-600",
};

export function HomePageClient() {
  const [todayPlan, setTodayPlan] = useState<{
    routine: Routine;
    day: RoutineDay;
  } | null>(null);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [streak, setStreak] = useState({ current: 0, longest: 0 });
  const [todayLog, setTodayLog] = useState<WorkoutLog | null>(null);
  const [quote, setQuote] = useState(QUOTES[0]);

  useEffect(() => {
    const todayRoutine = getTodayRoutineDay();
    setTodayPlan(todayRoutine);

    const userProgress = getUserProgress();
    setProgress(userProgress);

    const logs = getWorkoutLogs();
    const streakData = calculateStreak(logs);
    setStreak(streakData);

    // Today's log
    const todayStr = getTodayDateString();
    const log = logs.find((l) => l.date === todayStr) ?? null;
    setTodayLog(log);

    // Random quote
    const idx = Math.floor(Math.random() * QUOTES.length);
    setQuote(QUOTES[idx]);
  }, []);

  const isRestDay = todayPlan?.routine.type === "recovery";
  const levelColor =
    LEVEL_COLORS[progress?.currentLevel ?? "foundation"];
  const todayCompleted = todayLog?.isCompleted ?? false;
  const primarySession = todayPlan?.day.sessions[0];
  const exerciseCount =
    todayPlan?.day.sessions.reduce(
      (sum, session) => sum + session.exercises.length,
      0
    ) ?? 0;
  const estimatedDuration = todayPlan
    ? getRoutineEstimatedMinutes(todayPlan.day)
    : 0;
  const difficulty = todayPlan ? getRoutineDifficulty(todayPlan.day) : 0;

  return (
    <div className="page">
      <div className="px-4 pt-12 pb-4 flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col gap-1 animate-slide-up">
          <p className="text-slate-500 text-sm font-medium">
            {getTodayDisplayString()}
          </p>
          <h1 className="text-3xl font-black text-slate-100 leading-tight">
            Good{" "}
            {new Date().getHours() < 12
              ? "Morning"
              : new Date().getHours() < 17
              ? "Afternoon"
              : "Evening"}{" "}
            🏀
          </h1>
          <p className="text-slate-400 text-sm italic mt-1">"{quote}"</p>
        </div>

        {/* Streak + Level bar */}
        <div
          className="grid grid-cols-2 gap-3 animate-slide-up"
          style={{ animationDelay: "0.05s" }}
        >
          <div className="card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center flex-shrink-0">
              <Flame size={20} className="text-brand-400" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-100">
                {streak.current}
              </p>
              <p className="text-xs text-slate-500 font-medium">Day Streak</p>
            </div>
          </div>
          <div className="card p-4 flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl bg-gradient-to-br ${levelColor} flex items-center justify-center flex-shrink-0`}
            >
              <Trophy size={18} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-black text-slate-100">
                {LEVEL_LABELS[progress?.currentLevel ?? "foundation"]}
              </p>
              <p className="text-xs text-slate-500 font-medium">Level</p>
            </div>
          </div>
        </div>

        {/* Today's Workout Card */}
        {todayPlan && primarySession ? (
          <div
            className="animate-slide-up"
            style={{ animationDelay: "0.1s" }}
          >
            <p className="section-label mb-3">Today's Workout</p>
            <div
              className={`rounded-3xl overflow-hidden border ${
                todayCompleted
                  ? "border-emerald-500/30"
                  : "border-white/5"
              }`}
            >
              {/* Color header */}
              <div
                className={`p-5 ${
                  isRestDay
                    ? "bg-gradient-to-br from-teal-900/60 to-teal-950"
                    : todayCompleted
                    ? "bg-gradient-to-br from-emerald-900/60 to-emerald-950"
                    : "bg-gradient-to-br from-brand-900/60 to-dark-900"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={difficulty >= 7 ? "brand" : difficulty >= 5 ? "warning" : "success"}
                      >
                        Difficulty {difficulty}/10
                      </Badge>
                      <Badge variant="default">
                        {todayPlan.routine.type}
                      </Badge>
                    </div>
                    <h2 className="text-2xl font-black text-slate-100">
                      {primarySession.title}
                    </h2>
                    {todayCompleted && (
                      <p className="text-emerald-400 text-sm font-semibold">
                        ✓ Completed today!
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0 text-4xl">
                    {todayCompleted ? "🏆" : isRestDay ? "🧘" : "💪"}
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="bg-dark-800 p-5 flex flex-col gap-4">
                <p className="text-slate-400 text-sm leading-relaxed">
                  Plan → Execute → Adapt. Follow each exercise in guided workout mode.
                </p>

                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Clock size={14} className="text-brand-500" />
                    {formatDuration(estimatedDuration)}
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Dumbbell size={14} className="text-brand-500" />
                    {exerciseCount} exercises
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Star size={14} className="text-brand-500" />
                    {todayPlan.routine.name}
                  </span>
                </div>

                <Link href="/workout/execute">
                  <Button variant="primary" size="xl">
                    <Zap size={20} />
                    {todayCompleted ? "REVIEW WORKOUT" : "START WORKOUT"}
                    <ChevronRight size={18} />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="card p-8 flex flex-col items-center gap-3 text-center animate-slide-up">
            <span className="text-4xl">🏀</span>
            <p className="text-slate-300 font-semibold">No workout scheduled</p>
            <p className="text-slate-500 text-sm">
              Check your calendar for the next routine day
            </p>
          </div>
        )}

        {/* Quick Links */}
        <div
          className="flex flex-col gap-2 animate-slide-up"
          style={{ animationDelay: "0.15s" }}
        >
          <p className="section-label">Quick Access</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                href: "/calendar",
                icon: "📅",
                label: "Calendar",
                sub: "View routine plan",
              },
              {
                href: "/progress",
                icon: "📈",
                label: "Progress",
                sub: "Skills & streaks",
              },
            ].map(({ href, icon, label, sub }) => (
              <Link
                key={href}
                href={href}
                className="card-hover p-4 flex items-center gap-3"
              >
                <span className="text-2xl">{icon}</span>
                <div>
                  <p className="text-sm font-bold text-slate-200">{label}</p>
                  <p className="text-xs text-slate-500">{sub}</p>
                </div>
                <ChevronRight
                  size={16}
                  className="text-slate-600 ml-auto flex-shrink-0"
                />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
