"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Pause, Play } from "lucide-react";
import { formatTimer } from "@/lib/workout";
import type { TimerPreset } from "@/types";

interface WorkoutTimerProps {
  initialDuration?: number;
  isVisible: boolean;
  onComplete: () => void;
  onClose: () => void;
}

const PRESETS: { label: string; value: TimerPreset }[] = [
  { label: "30s", value: 30 },
  { label: "45s", value: 45 },
  { label: "60s", value: 60 },
  { label: "75s", value: 75 },
  { label: "90s", value: 90 },
  { label: "2m", value: 120 },
];

export function WorkoutTimer({
  initialDuration = 60,
  isVisible,
  onComplete,
  onClose,
}: WorkoutTimerProps) {
  const [duration, setDuration] = useState(initialDuration);
  const [remaining, setRemaining] = useState(initialDuration);
  const [isRunning, setIsRunning] = useState(true);

  useEffect(() => {
    setRemaining(initialDuration);
    setDuration(initialDuration);
    setIsRunning(true);
  }, [initialDuration, isVisible]);

  useEffect(() => {
    if (!isRunning || remaining <= 0 || !isVisible) return;
    const interval = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(interval);
          if (typeof navigator !== "undefined" && navigator.vibrate) {
            navigator.vibrate([300, 150, 300, 150, 300]);
          }
          onComplete();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, remaining, isVisible, onComplete]);

  const selectPreset = (preset: TimerPreset) => {
    setDuration(preset);
    setRemaining(preset);
    setIsRunning(true);
  };

  const radius = 100;
  const sw = 10;
  const size = (radius + sw) * 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - ((duration - remaining) / duration) * circumference;

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-dark-950 p-6 animate-fade-in">
      {/* Header */}
      <div className="flex w-full items-center justify-between pt-safe">
        <span className="text-slate-400 font-semibold text-sm uppercase tracking-widest">Timer</span>
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Ring timer */}
      <div className="flex flex-col items-center gap-4">
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="absolute -rotate-90">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth={sw}
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={remaining === 0 ? "#10b981" : "#f97316"}
              strokeWidth={sw}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="progress-ring-circle"
            />
          </svg>
          <div className="relative z-10 flex flex-col items-center">
            <span className="text-8xl font-black text-white timer-display tabular-nums leading-none">
              {remaining === 0 ? "✓" : formatTimer(remaining)}
            </span>
            {remaining > 0 && (
              <span className="text-slate-500 text-sm mt-2">
                of {formatTimer(duration)}
              </span>
            )}
          </div>
        </div>

        {/* Play/Pause */}
        <button
          onClick={() => setIsRunning((r) => !r)}
          className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-semibold text-lg hover:bg-white/10 transition-colors"
        >
          {isRunning ? <Pause size={24} /> : <Play size={24} />}
          {isRunning ? "Pause" : "Resume"}
        </button>
      </div>

      {/* Presets */}
      <div className="w-full">
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">
          Quick Select
        </p>
        <div className="grid grid-cols-3 gap-2">
          {PRESETS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => selectPreset(value)}
              className={`py-3 rounded-2xl text-sm font-bold transition-all ${
                duration === value
                  ? "bg-brand-500 text-white shadow-glow"
                  : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
