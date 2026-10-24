import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CareReceipt — check a hospital bill",
  description:
    "Paste an itemised US hospital bill and see which lines are priced above what the procedure actually costs locally, what is worth disputing, and what to say.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
