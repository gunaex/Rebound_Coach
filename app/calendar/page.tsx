import type { Metadata } from "next";
import { CalendarPageClient } from "@/features/calendar/CalendarPageClient";

export const metadata: Metadata = {
  title: "Calendar — Rebound Coach",
  description: "Monthly workout calendar. Tap any day to see what's scheduled.",
};

export default function CalendarPage() {
  return <CalendarPageClient />;
}
