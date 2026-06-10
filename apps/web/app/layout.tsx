import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en">
      <body className="min-h-screen bg-white text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
