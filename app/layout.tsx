import type { Metadata } from "next";
import "./globals.css";
import { Shell } from "@/components/eves/shell";
export const metadata: Metadata = {
  title: { default: "EVES · Reporting", template: "%s · EVES" },
  description:
    "EVES project tagging, regulatory reporting and charging infrastructure insights.",
  icons: { icon: "/favicon.svg" },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
