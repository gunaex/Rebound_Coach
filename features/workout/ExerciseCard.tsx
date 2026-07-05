"use client";

import { useState } from "react";
import Image from "next/image";
import {
  ChevronRight,
  Dumbbell,
  Clock,
  RotateCcw,
  Trophy,
  AlertCircle,
  Lightbulb,
  Info,
  CheckCircle2,
} from "lucide-react";
import type { Exercise } from "@/types";
import { Badge, difficultyVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type Tab = "info" | "tips" | "mistakes" | "basketball";

interface ExerciseCardProps {
  exercise: Exercise;
  index: number;
  total: number;
  isCompleted: boolean;
  onComplete: () => void;
  onStartTimer?: () => void;
}

export function ExerciseCard({
  exercise,
  index,
  total,
  isCompleted,
  onComplete,
  onStartTimer,
}: ExerciseCardProps) {
  const [activeTab, setActiveTab] = useState<Tab>("info");
  const [imgError, setImgError] = useState(false);

  const tabs: { id: Tab; icon: React.ReactNode; label: string }[] = [
    { id: "info", icon: <Info size={14} />, label: "Info" },
    { id: "tips", icon: <Lightbulb size={14} />, label: "Tips" },
    { id: "mistakes", icon: <AlertCircle size={14} />, label: "Mistakes" },
    { id: "basketball", icon: <Trophy size={14} />, label: "Ball" },
  ];

  const isLegendary = exercise.difficulty === "legendary";

  return (
    <div
      className={cn(
        "flex flex-col gap-0 rounded-3xl overflow-hidden shadow-float border animate-slide-up",
        isCompleted
          ? "border-emerald-500/30 bg-emerald-950/20"
          : isLegendary
          ? "border-purple-500/30 bg-dark-800"
          : "border-white/5 bg-dark-800"
      )}
    >
      {/* Header Image */}
      <div className="relative w-full h-48 bg-dark-700 overflow-hidden">
        {!imgError ? (
          <Image
            src={exercise.image}
            alt={exercise.name}
            fill
            className="object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div
            className={cn(
              "w-full h-full flex flex-col items-center justify-center gap-2",
              isLegendary
                ? "bg-gradient-legendary"
                : "bg-gradient-to-br from-dark-700 to-dark-900"
            )}
          >
            <Dumbbell
              size={48}
              className={isLegendary ? "text-white/80" : "text-brand-500"}
            />
            <span className="text-sm text-slate-400">{exercise.name}</span>
          </div>
        )}

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-dark-800 via-transparent to-transparent" />

        {/* Progress pill */}
        <div className="absolute top-3 right-3">
          <span className="bg-black/60 backdrop-blur-sm text-xs font-semibold text-white px-3 py-1.5 rounded-full">
            {index + 1} / {total}
          </span>
        </div>

        {/* Completed checkmark */}
        {isCompleted && (
          <div className="absolute top-3 left-3 bg-emerald-500 rounded-full p-1">
            <CheckCircle2 size={18} className="text-white" />
          </div>
        )}

        {/* Legendary badge */}
        {isLegendary && !isCompleted && (
          <div className="absolute top-3 left-3">
            <Badge variant="legendary">✦ Legendary</Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col gap-4">
        {/* Title + Badges */}
        <div className="flex flex-col gap-2">
          <div className="flex items-start justify-between gap-2">
            <h2
              className={cn(
                "text-xl font-bold leading-tight",
                isLegendary ? "text-gradient-legendary" : "text-slate-100"
              )}
            >
              {exercise.name}
            </h2>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Badge variant={difficultyVariant(exercise.difficulty)}>
              {exercise.difficulty.charAt(0).toUpperCase() +
                exercise.difficulty.slice(1)}
            </Badge>
            <Badge variant="info">{exercise.category}</Badge>
            {exercise.primaryMuscles.slice(0, 2).map((m) => (
              <Badge key={m} variant="default">
                {m}
              </Badge>
            ))}
          </div>
        </div>

        {/* Sets / Reps / Rest */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Sets", value: exercise.sets.toString(), icon: <RotateCcw size={14} /> },
            { label: "Reps", value: exercise.reps, icon: <Dumbbell size={14} /> },
            {
              label: "Rest",
              value: `${exercise.rest}s`,
              icon: <Clock size={14} />,
            },
          ].map(({ label, value, icon }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-1 bg-white/5 rounded-2xl py-3 px-2"
            >
              <span className="text-slate-500 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider">
                {icon} {label}
              </span>
              <span className="text-base font-bold text-slate-100">{value}</span>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex bg-white/5 rounded-2xl p-1 gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-semibold transition-all duration-200",
                activeTab === tab.id
                  ? "bg-white/10 text-slate-100 shadow-sm"
                  : "text-slate-500 hover:text-slate-300"
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="min-h-[120px]">
          {activeTab === "info" && (
            <div className="animate-fade-in space-y-2">
              <p className="text-slate-300 text-sm leading-relaxed">
                {exercise.description}
              </p>
              {exercise.skillName && (
                <div className="flex items-center gap-2 mt-3 p-2.5 bg-brand-500/10 rounded-xl border border-brand-500/20">
                  <span className="text-brand-400 text-sm">⚡</span>
                  <div>
                    <p className="text-brand-300 text-xs font-bold">
                      Skill Unlocked: {exercise.skillName}
                    </p>
                    <p className="text-brand-400/70 text-xs">
                      {exercise.skillDescription}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "tips" && (
            <ul className="animate-fade-in space-y-2">
              {exercise.coachTips.map((tip, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-brand-400 mt-0.5 flex-shrink-0">✓</span>
                  <span className="text-slate-300 text-sm">{tip}</span>
                </li>
              ))}
            </ul>
          )}

          {activeTab === "mistakes" && (
            <ul className="animate-fade-in space-y-2">
              {exercise.commonMistakes.map((mistake, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5 flex-shrink-0">✗</span>
                  <span className="text-slate-300 text-sm">{mistake}</span>
                </li>
              ))}
            </ul>
          )}

          {activeTab === "basketball" && (
            <div className="animate-fade-in">
              <div className="flex items-start gap-3 p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20">
                <span className="text-2xl flex-shrink-0">🏀</span>
                <div>
                  <p className="text-amber-300 text-xs font-bold uppercase tracking-wider mb-1">
                    Basketball Benefit
                  </p>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    {exercise.basketballBenefit}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-1">
          {exercise.isTimed && !isCompleted && (
            <Button
              variant="secondary"
              size="md"
              className="flex-1"
              onClick={onStartTimer}
            >
              <Clock size={16} /> Timer
            </Button>
          )}
          <Button
            variant={isCompleted ? "secondary" : "primary"}
            size="lg"
            className={cn("flex-1", isCompleted && "opacity-70")}
            onClick={!isCompleted ? onComplete : undefined}
          >
            {isCompleted ? (
              <>
                <CheckCircle2 size={18} /> Done
              </>
            ) : (
              <>
                Mark Complete <ChevronRight size={18} />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
