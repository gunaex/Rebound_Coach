"use client";

import { useState, useEffect } from "react";
import {
  Bell,
  Dumbbell,
  RotateCcw,
  Volume2,
  Info,
} from "lucide-react";
import { getSettings, saveSettings, resetUserProgress, clearWorkoutLogs } from "@/lib/storage";
import type { AppSettings, TimerPreset } from "@/types";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const REST_PRESETS: { label: string; value: TimerPreset }[] = [
  { label: "60 sec", value: 60 },
  { label: "90 sec", value: 90 },
  { label: "2 min", value: 120 },
];

export function SettingsPageClient() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [saved, setSaved] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    setSettings(getSettings());
  }, []);

  function update<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    if (!settings) return;
    const next = { ...settings, [key]: value };
    setSettings(next);
    saveSettings(next);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  function handleReset() {
    resetUserProgress();
    clearWorkoutLogs();
    setShowResetConfirm(false);
  }

  if (!settings) return null;

  return (
    <div className="page">
      <div className="px-4 pt-12 pb-4 flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black text-slate-100">Settings</h1>
          {saved && (
            <span className="text-xs font-semibold text-emerald-400 animate-fade-in">
              ✓ Saved
            </span>
          )}
        </div>

        {/* Rest Timer */}
        <div className="card p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-brand-400" />
            <p className="font-bold text-slate-200">Default Rest Timer</p>
          </div>
          <div className="flex gap-2">
            {REST_PRESETS.map(({ label, value }) => (
              <button
                key={value}
                onClick={() => update("defaultRestTimer", value)}
                className={cn(
                  "flex-1 py-3 rounded-xl text-sm font-bold transition-all",
                  settings.defaultRestTimer === value
                    ? "bg-brand-500 text-white shadow-glow"
                    : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Weight Unit */}
        <div className="card p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Dumbbell size={18} className="text-brand-400" />
            <p className="font-bold text-slate-200">Weight Unit</p>
          </div>
          <div className="flex gap-2">
            {(["kg", "lbs"] as const).map((unit) => (
              <button
                key={unit}
                onClick={() => update("weightUnit", unit)}
                className={cn(
                  "flex-1 py-3 rounded-xl text-sm font-bold transition-all uppercase tracking-wider",
                  settings.weightUnit === unit
                    ? "bg-brand-500 text-white shadow-glow"
                    : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
                )}
              >
                {unit}
              </button>
            ))}
          </div>
        </div>

        {/* Toggles */}
        <div className="card p-5 flex flex-col gap-0 divide-y divide-white/5">
          {[
            {
              key: "vibrationEnabled" as keyof AppSettings,
              label: "Vibration",
              sub: "Vibrate when timer ends",
              icon: <Bell size={16} />,
            },
            {
              key: "autoStartRestTimer" as keyof AppSettings,
              label: "Auto Rest Timer",
              sub: "Start automatically after each set",
              icon: <RotateCcw size={16} />,
            },
            {
              key: "soundEnabled" as keyof AppSettings,
              label: "Sound Effects",
              sub: "Audio cues for timers",
              icon: <Volume2 size={16} />,
            },
          ].map(({ key, label, sub, icon }) => (
            <div key={key} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
              <div className="flex items-center gap-3">
                <span className="text-slate-500">{icon}</span>
                <div>
                  <p className="text-sm font-semibold text-slate-200">{label}</p>
                  <p className="text-xs text-slate-500">{sub}</p>
                </div>
              </div>
              <button
                onClick={() => update(key, !settings[key] as AppSettings[typeof key])}
                className={cn(
                  "w-12 h-6 rounded-full transition-all duration-200 relative flex-shrink-0",
                  settings[key] ? "bg-brand-500" : "bg-white/10"
                )}
              >
                <span
                  className={cn(
                    "absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-200",
                    settings[key] ? "left-7" : "left-1"
                  )}
                />
              </button>
            </div>
          ))}
        </div>

        {/* About */}
        <div className="card p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2 mb-1">
            <Info size={18} className="text-brand-400" />
            <p className="font-bold text-slate-200">About Rebound Coach</p>
          </div>
          <div className="flex flex-col gap-1 text-sm text-slate-400">
            <div className="flex justify-between">
              <span>Version</span>
              <span className="text-slate-300 font-semibold">0.1.0 — Phase 1</span>
            </div>
            <div className="flex justify-between">
              <span>Phase</span>
              <span className="text-slate-300 font-semibold">Foundation</span>
            </div>
            <div className="flex justify-between">
              <span>Exercises</span>
              <span className="text-slate-300 font-semibold">17 exercises</span>
            </div>
          </div>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            Rebound Coach is your personal basketball performance + fat loss companion.
            Built for consistency, designed for champions.
          </p>
        </div>

        {/* Danger Zone */}
        <div className="card p-5 border border-red-500/20 flex flex-col gap-3">
          <p className="text-sm font-bold text-red-400">Danger Zone</p>
          {!showResetConfirm ? (
            <Button
              variant="destructive"
              size="md"
              onClick={() => setShowResetConfirm(true)}
            >
              <RotateCcw size={16} />
              Reset All Progress
            </Button>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-slate-400">
                Are you sure? This will delete all your workout logs and progress. This cannot be undone.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  size="md"
                  className="flex-1"
                  onClick={handleReset}
                >
                  Yes, Reset
                </Button>
                <Button
                  variant="secondary"
                  size="md"
                  className="flex-1"
                  onClick={() => setShowResetConfirm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
