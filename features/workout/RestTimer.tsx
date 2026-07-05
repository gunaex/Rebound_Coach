"use client";

import { useState, useEffect } from "react";
import { X, SkipForward } from "lucide-react";
import { formatTimer } from "@/lib/workout";
import { cn } from "@/lib/utils";

interface RestTimerProps {
  duration: number; // seconds
  onComplete: () => void;
  onSkip: () => void;
  isVisible: boolean;
  exerciseName?: string;
}

export function RestTimer({
  duration,
  onComplete,
  onSkip,
  isVisible,
  exerciseName,
}: RestTimerProps) {
  const [remaining, setRemaining] = useState(duration);
  const [isRunning, setIsRunning] = useState(true);

  useEffect(() => {
    setRemaining(duration);
    setIsRunning(true);
  }, [duration, isVisible]);

  useEffect(() => {
    if (!isRunning || remaining <= 0 || !isVisible) return;
    const interval = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(interval);
          // Vibrate on completion
          if (typeof navigator !== "undefined" && navigator.vibrate) {
            navigator.vibrate([200, 100, 200]);
          }
          onComplete();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, remaining, isVisible, onComplete]);

  const percentage = ((duration - remaining) / duration) * 100;
  const radius = 80;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-dark-950/95 backdrop-blur-xl animate-fade-in">
      {/* Close */}
      <button
        onClick={onSkip}
        className="absolute top-6 right-6 p-2 rounded-full bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
      >
        <X size={20} />
      </button>

      {/* Label */}
      <div className="flex flex-col items-center gap-2 mb-10">
        <span className="text-slate-500 text-xs font-semibold uppercase tracking-widest">Rest</span>
        {exerciseName && (
          <span className="text-slate-300 text-sm">Next: ready to continue</span>
        )}
      </div>

      {/* Ring timer */}
      <div className="relative flex items-center justify-center" style={{ width: 200, height: 200 }}>
        <svg width={200} height={200} className="absolute -rotate-90">
          {/* Track */}
          <circle
            cx={100}
            cy={100}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth={8}
          />
          {/* Progress */}
          <circle
            cx={100}
            cy={100}
            r={radius}
            fill="none"
            stroke="#f97316"
            strokeWidth={8}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="progress-ring-circle"
          />
        </svg>
        <div className="relative z-10 flex flex-col items-center">
          <span className="text-7xl font-black text-white timer-display tabular-nums">
            {formatTimer(remaining)}
          </span>
          <span className="text-slate-500 text-sm mt-1">remaining</span>
        </div>
      </div>

      {/* Preset buttons */}
      <div className="flex gap-3 mt-10 flex-wrap justify-center px-6">
        {([60, 90, 120] as const).map((preset) => (
          <button
            key={preset}
            onClick={() => setRemaining(preset)}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-semibold transition-all",
              remaining === preset && duration === preset
                ? "bg-brand-500/20 text-brand-400 border border-brand-500/40"
                : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
            )}
          >
            {preset}s
          </button>
        ))}
      </div>

      {/* Skip button */}
      <button
        onClick={onSkip}
        className="mt-8 flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/5 text-slate-300 font-semibold hover:bg-white/10 transition-colors"
      >
        <SkipForward size={16} />
        Skip Rest
      </button>
    </div>
  );
}
