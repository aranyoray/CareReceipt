import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CareReceipt — check a hospital bill",
  description:
    "Photograph or paste an itemised US hospital bill and see which lines are priced above what the procedure actually costs locally, what is worth disputing, and what to say.",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "CareReceipt" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // The app bar runs under the status bar and the tab bar under the home
  // indicator, so the page has to own the safe areas.
  viewportFit: "cover",
  themeColor: "#124045",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light">
      <body>{children}</body>
    </html>
  );
}
