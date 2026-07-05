import type { Metadata } from "next";
import { WorkoutPageClient } from "@/features/workout/WorkoutPageClient";

export const metadata: Metadata = {
  title: "Execute Workout - Rebound Coach",
  description: "Full-screen guided workout execution mode.",
};

export default function ExecuteWorkoutPage() {
  return <WorkoutPageClient />;
}
