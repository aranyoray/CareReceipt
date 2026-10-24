import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ReliefReceipt — get a hospital bill written off",
  description:
    "Work out what financial assistance you qualify for under your state's charity-care rules, and generate the application letter.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
