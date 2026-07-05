import type { Metadata } from "next";
import { WorkoutPageClient } from "@/features/workout/WorkoutPageClient";

export const metadata: Metadata = {
  title: "Workout — Rebound Coach",
  description: "Today's exercise cards with coach tips, timers, and rest periods.",
};

export default function WorkoutPage() {
  return <WorkoutPageClient />;
}
