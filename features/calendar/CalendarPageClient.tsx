"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getTodayDateString, formatDuration } from "@/lib/workout";
import {
  getRoutineDayForDate,
  getRoutineDifficulty,
  getRoutineEstimatedMinutes,
} from "@/lib/routines";
import { getWorkoutLogs } from "@/lib/storage";
import type { Routine, RoutineDay, WorkoutLog } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const ROUTINE_DOT_COLORS: Record<string, string> = {
  strength: "bg-brand-500",
  basketball: "bg-amber-400",
  recovery: "bg-teal-400",
};

export function CalendarPageClient() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedRoutine, setSelectedRoutine] = useState<{
    routine: Routine;
    day: RoutineDay;
  } | null>(null);
  const [logs, setLogs] = useState<WorkoutLog[]>([]);

  useEffect(() => {
    setLogs(getWorkoutLogs());
  }, []);

  const todayStr = getTodayDateString();

  // Build calendar days for current month
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarDays: (string | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => {
      const d = i + 1;
      return `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    }),
  ];

  function isCompleted(dateStr: string) {
    return logs.some((l) => l.date === dateStr && l.isCompleted);
  }

  function handleDaySelect(dateStr: string) {
    setSelectedDate(dateStr);
    setSelectedRoutine(getRoutineDayForDate(dateStr));
  }

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  }

  return (
    <div className="page">
      <div className="px-4 pt-12 pb-4 flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black text-slate-100">Calendar</h1>
        </div>

        {/* Month nav */}
        <div className="flex items-center justify-between">
          <button
            onClick={prevMonth}
            className="p-2 rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-lg font-bold text-slate-100">
            {MONTHS[month]} {year}
          </span>
          <button
            onClick={nextMonth}
            className="p-2 rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1">
          {WEEKDAYS.map((d) => (
            <div key={d} className="text-center text-[11px] font-semibold text-slate-600 uppercase tracking-wider py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1 -mt-4">
          {calendarDays.map((dateStr, idx) => {
            if (!dateStr) return <div key={`empty-${idx}`} />;
            const dayNum = parseInt(dateStr.split("-")[2]);
            const isToday = dateStr === todayStr;
            const isPast = dateStr < todayStr;
            const completed = isCompleted(dateStr);
            const routineMatch = getRoutineDayForDate(dateStr);
            const isSelected = dateStr === selectedDate;

            return (
              <button
                key={dateStr}
                onClick={() => handleDaySelect(dateStr)}
                className={cn(
                  "aspect-square flex flex-col items-center justify-center rounded-xl text-sm font-semibold transition-all duration-200",
                  isToday && "ring-2 ring-brand-500",
                  isSelected && "bg-brand-500/20",
                  completed && "bg-emerald-500/20",
                  !completed && !isToday && isPast && "opacity-50",
                  !completed && !isToday && !isPast && "hover:bg-white/5"
                )}
              >
                <span
                  className={cn(
                    isToday ? "text-brand-400" :
                    completed ? "text-emerald-400" :
                    "text-slate-300"
                  )}
                >
                  {dayNum}
                </span>
                {routineMatch && (
                  <span
                    className={cn(
                      "w-1.5 h-1.5 rounded-full mt-0.5",
                      completed ? "bg-emerald-400" :
                      isToday ? "bg-brand-500" :
                      ROUTINE_DOT_COLORS[routineMatch.routine.type] ?? "bg-slate-600"
                    )}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 text-xs">
          {[
            { color: "bg-brand-500", label: "Today" },
            { color: "bg-emerald-500", label: "Completed" },
            { color: "bg-brand-500/40", label: "Scheduled" },
          ].map(({ color, label }) => (
            <span key={label} className="flex items-center gap-1.5 text-slate-500">
              <span className={`w-2 h-2 rounded-full ${color}`} /> {label}
            </span>
          ))}
        </div>

        {/* Selected day detail */}
        {selectedDate && (
          <div className="card p-5 flex flex-col gap-3 animate-slide-up">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest mb-1">
                  {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
                {selectedRoutine ? (
                  <h3 className="text-xl font-black text-slate-100">
                    {selectedRoutine.day.sessions[0]?.title ?? selectedRoutine.routine.name}
                  </h3>
                ) : (
                  <h3 className="text-lg font-bold text-slate-500">No Workout</h3>
                )}
              </div>
              {isCompleted(selectedDate) && (
                <span className="text-2xl">✅</span>
              )}
            </div>

            {selectedRoutine && (
              <>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="default">
                    {selectedRoutine.routine.type}
                  </Badge>
                  <Badge variant="warning">
                    Difficulty {getRoutineDifficulty(selectedRoutine.day)}/10
                  </Badge>
                  <Badge variant="info">
                    {formatDuration(getRoutineEstimatedMinutes(selectedRoutine.day))}
                  </Badge>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {selectedRoutine.routine.name}
                </p>
                <p className="text-slate-500 text-xs">
                  {selectedRoutine.day.sessions.reduce(
                    (sum, session) => sum + session.exercises.length,
                    0
                  )} exercises · {selectedRoutine.day.sessions.length} session
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
