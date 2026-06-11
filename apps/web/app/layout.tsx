import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { ClerkThemeProvider } from "@/components/clerk-theme-provider";
import { SiteHeader } from "@/components/site-header";
import { PageShell } from "@/components/page-shell";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SoccerX — Predict. Compete. Brag.",
  description:
    "A 39-day daily-return social game for the 2026 FIFA World Cup. Pick your bracket, score live, beat your friends.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${display.variable}`}
    >
      <body
        suppressHydrationWarning
        className="min-h-screen bg-surface font-sans text-fg antialiased"
      >
        <ThemeProvider>
          <ClerkThemeProvider>
            <div className="pointer-events-none fixed inset-0 bg-stadium-radial" />
            <div className="pointer-events-none fixed inset-x-0 top-14 h-px bg-gradient-to-r from-transparent via-line/15 to-transparent" />
            <div className="relative flex min-h-screen flex-col">
              <SiteHeader />
              <main className="flex-1">
                <PageShell>{children}</PageShell>
              </main>
              <footer className="border-t border-line/10 px-6 py-6 text-center text-[11px] text-fg-dim">
                SoccerX v0.1 — built for the 2026 cycle
              </footer>
            </div>
          </ClerkThemeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
