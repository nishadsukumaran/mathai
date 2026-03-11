/**
 * @module apps/web/app/layout
 *
 * Root layout for MathAI.
 * Wraps the full app with:
 *   - Session provider (NextAuth)
 *   - React Query provider (server state)
 *   - Global styles
 *   - Font configuration
 *
 * UI components in this file are intentionally minimal — detailed design
 * lives in feature-specific layouts. v0 generates the visual components;
 * this file is the structural shell.
 */

import type { Metadata } from "next";
import { Inter, Nunito } from "next/font/google";
import "./globals.css";
import { Providers }  from "./providers";
import { AppNav }      from "@/components/mathai/AppNav";
import { RootMain }    from "@/components/shared/RootMain";
import { ScrollToTop } from "@/components/shared/ScrollToTop";

// Nunito is the primary font — friendly, rounded, great for kids
const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MathAI — Learn Math, Level Up",
  description: "AI-powered math tutoring for kids. Practice, earn XP, and conquer every topic!",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "MathAI",
    description: "Gamified AI math tutoring for kids",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${nunito.variable} ${inter.variable}`}>
      <body className="font-nunito bg-gradient-to-br from-indigo-50 to-purple-50 min-h-screen">
        <Providers>
          {/* Nav: fixed bottom bar (mobile) + fixed left sidebar (desktop) */}
          <ScrollToTop />
          <AppNav />
          {/*
           * RootMain conditionally applies sidebar padding:
           *   Student routes: pb-20 md:pb-0 md:pl-20 xl:pl-56
           *   Admin routes  : no padding (AdminLayout is self-contained)
           */}
          <RootMain>{children}</RootMain>
        </Providers>
      </body>
    </html>
  );
}
