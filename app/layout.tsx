import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Audit Quality Agent — IFRS disclosure slice",
  description: "A PM work-sample for Cortea.ai: standards-grounded, evidence-anchored, human-in-the-loop.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
