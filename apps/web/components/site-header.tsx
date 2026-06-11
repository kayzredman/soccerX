"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { ThemeToggle } from "@/components/theme-toggle";

const NAV = [
  { href: "/bracket", label: "Bracket" },
  { href: "/live", label: "Live" },
  { href: "/standings", label: "Standings" },
  { href: "/daily", label: "Daily" },
  { href: "/league", label: "League" },
  { href: "/leaderboard", label: "Leaderboard" },
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  const { isSignedIn, isLoaded } = useUser();

  return (
    <header className="sticky top-0 z-40 border-b border-line/10 bg-surface/70 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-neon-lime text-ink-900 shadow-glow">
            <span className="font-display text-sm font-black leading-none">X</span>
          </span>
          <span className="font-display text-base font-bold tracking-tight text-fg">
            SoccerX
          </span>
          <span className="hidden rounded-full border border-line/15 px-2 py-0.5 text-[10px] font-mono uppercase tracking-widest text-fg-muted sm:inline">
            WC26
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => {
            const active =
              pathname === item.href || pathname?.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href as never}
                className="relative px-3 py-1.5 text-sm text-fg-muted transition hover:text-fg"
              >
                {active && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-0 rounded-lg bg-line/10"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span className={`relative ${active ? "text-fg" : ""}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {isLoaded && !isSignedIn && (
            <Link
              href="/login"
              className="rounded-lg bg-neon-lime px-3 py-1.5 text-sm font-semibold text-ink-900 shadow-glow transition hover:brightness-110"
            >
              Sign in
            </Link>
          )}
          {isLoaded && isSignedIn && (
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "h-8 w-8 ring-1 ring-line/15",
                },
              }}
            />
          )}
        </div>
      </div>

      <nav className="flex gap-1 overflow-x-auto border-t border-line/10 px-4 py-2 md:hidden">
        {NAV.map((item) => {
          const active =
            pathname === item.href || pathname?.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href as never}
              className={`whitespace-nowrap rounded-full px-3 py-1 text-xs ${
                active
                  ? "bg-line/15 text-fg"
                  : "text-fg-muted hover:text-fg"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
