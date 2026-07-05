import type { Metadata } from "next";
import { ProgressPageClient } from "@/features/progress/ProgressPageClient";

export const metadata: Metadata = {
  title: "Progress — Rebound Coach",
  description: "Track your streak, level, skills, and workout history.",
};

export default function ProgressPage() {
  return <ProgressPageClient />;
}
