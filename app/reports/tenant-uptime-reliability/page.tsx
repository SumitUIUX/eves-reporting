import { ReportPage } from "@/components/eves/report-page";

export const metadata = { title: "Uptime & reliability" };

export default function Page() {
  return <ReportPage kind="tenantUptime" />;
}
