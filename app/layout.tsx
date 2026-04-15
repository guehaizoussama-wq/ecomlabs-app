import type { Metadata } from "next";
import { DM_Sans, Space_Grotesk } from "next/font/google";
import { SpeedInsights } from '@vercel/speed-insights/next';

import "@/app/globals.css";

const fontSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans"
});

const fontMono = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-mono"
});

export const metadata: Metadata = {
  title: "EcomLabs",
  description: "Enterprise-grade multi-tenant SaaS for e-commerce operations."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${fontSans.variable} ${fontMono.variable}`}>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
