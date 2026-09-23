import type { Metadata } from "next";

import { ExecutiveDashboard } from "@/components/eves/executive-dashboard";

export const metadata: Metadata = {
  title: "Business Overview",
};

export default function DashboardPage() {
  return <ExecutiveDashboard />;
}
