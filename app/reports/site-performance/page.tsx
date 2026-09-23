import { ReportPage } from "@/components/eves/report-page";

export const metadata = { title: "Site performance" };

export default function Page() {
  return <ReportPage kind="sitePerformance" />;
}
