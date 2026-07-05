import type { Metadata } from "next";
import { SettingsPageClient } from "@/features/settings/SettingsPageClient";

export const metadata: Metadata = {
  title: "Settings — Rebound Coach",
  description: "Configure your training preferences.",
};

export default function SettingsPage() {
  return <SettingsPageClient />;
}
