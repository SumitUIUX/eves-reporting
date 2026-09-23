import type { Metadata } from "next";

import { ReportPage } from "@/components/eves/report-page";

export const metadata: Metadata = {
  title: "Revenue & transaction",
};

export default function RevenueTransactionPage() {
  return <ReportPage kind="revenueTransaction" />;
}
