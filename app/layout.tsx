import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Noto_Sans_SC, Noto_Sans_TC } from "next/font/google";
import "./globals.css";

const sans = Noto_Sans_SC({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-noto",
  display: "swap",
});

const sansTc = Noto_Sans_TC({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-noto-tc",
  display: "swap",
});

export const metadata: Metadata = {
  title: "中大穿梭校巴",
  description:
    "香港中文大学穿梭校巴指南：按香港时间选择起点和终点，看该乘哪一路。非实时，以交通处为准。",
  manifest: "/manifest.webmanifest",
  applicationName: "中大穿梭校巴",
  appleWebApp: {
    capable: true,
    title: "中大穿梭校巴",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#f5f5f7",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN" className={`${sans.variable} ${sansTc.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
