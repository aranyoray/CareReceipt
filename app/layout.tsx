import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CareReceipt",
  description:
    "The bill before the bill — turns invisible population health risk into one affordable next step. Illustrative prototype; not a diagnosis.",
};

export const viewport: Viewport = {
  themeColor: "#0a2e33",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
