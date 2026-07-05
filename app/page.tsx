import type { Metadata } from "next";
import { HomePageClient } from "@/features/home/HomePageClient";

export const metadata: Metadata = {
  title: "Home — Rebound Coach",
  description: "Today's workout, your streak, and quick access to your training plan.",
};

export default function HomePage() {
  return <HomePageClient />;
}
