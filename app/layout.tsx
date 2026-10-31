import type { Metadata, Viewport } from "next";
import "@fontsource/manrope/400.css";
import "@fontsource/manrope/500.css";
import "@fontsource/manrope/600.css";
import "@fontsource/manrope/700.css";
import "@fontsource/manrope/800.css";
import "./globals.css";
import "@/styles/tokens.css";
import "@/styles/primitives.css";
import "@/styles/boot.css";
import "@/styles/shell.css";
import "@/styles/feedback.css";
import "@/styles/overlays.css";
import "@/styles/page-layout.css";

export const metadata: Metadata = {
  title: { default: "Hambazi — Find your people", template: "%s · Hambazi" },
  description:
    "Find, join, or host friendly local sports matches. Find your people and play your game.",
  applicationName: "Hambazi",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Hambazi" },
  icons: { icon: "/brand-icon.svg", apple: "/icon-192.png" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#faf9fc",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
