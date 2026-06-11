"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MOCK_LEAGUES } from "@/lib/mock";
import { SceneBackground } from "@/components/scene-background";
import { SCENES } from "@/lib/scenes";

type Tab = "create" | "join";

export default function LeaguePage() {
  const [tab, setTab] = useState<Tab>("create");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  function copy(c: string) {
    navigator.clipboard?.writeText(c).then(() => {
      setCopied(c);
      setTimeout(() => setCopied(null), 1400);
    });
  }

  return (
    <div className="relative mx-auto max-w-6xl px-4 pb-24 pt-8 sm:px-6 sm:pt-12">
      <SceneBackground scene={SCENES.crowdFlags} variant="banner" />
      <header>
        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-neon-magenta">
          Mini-leagues
        </p>
        <h1 className="mt-3 font-display text-4xl font-black tracking-tight sm:text-5xl text-fg">
          Beat your friends.
        </h1>
        <p className="mt-2 max-w-xl text-sm text-fg-muted">
          8-character invite codes. Up to 50 members per league. Private
          leaderboards refresh after every match.
        </p>
      </header>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <section className="relative overflow-hidden rounded-2xl border border-line/10 bg-surface-2 p-5 shadow-ring sm:p-6">
          <div className="relative z-10">
            <div className="flex gap-1 rounded-xl border border-line/10 bg-surface-3 p-1">
              {(["create", "join"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className="relative flex-1 rounded-lg px-3 py-2 text-sm font-medium capitalize text-fg-muted transition"
                >
                  {tab === t && (
                    <motion.span
                      layoutId="league-tab"
                      className="absolute inset-0 rounded-lg bg-surface shadow-sm"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className={`relative ${tab === t ? "text-fg" : ""}`}>
                    {t === "create" ? "Create new" : "Join with code"}
                  </span>
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {tab === "create" ? (
                <motion.form
                  key="create"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22 }}
                  className="mt-5 space-y-4"
                  onSubmit={(e) => e.preventDefault()}
                >
                  <Field
                    label="League name"
                    hint="2–40 characters. Friends will see this."
                  >
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      maxLength={40}
                      placeholder="e.g. Office Hooligans"
                      className="w-full rounded-lg border border-line/15 bg-surface px-3 py-2.5 text-sm text-fg outline-none transition focus:border-neon-lime/60"
                    />
                  </Field>
                  <button
                    type="submit"
                    disabled={name.trim().length < 2}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-neon-lime px-4 py-3 text-sm font-semibold text-ink-900 shadow-glow transition hover:brightness-110 disabled:cursor-not-allowed disabled:bg-surface-3 disabled:text-fg-dim disabled:shadow-none"
                  >
                    Create league
                  </button>
                </motion.form>
              ) : (
                <motion.form
                  key="join"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22 }}
                  className="mt-5 space-y-4"
                  onSubmit={(e) => e.preventDefault()}
                >
                  <Field
                    label="Invite code"
                    hint="8 characters. Letters and digits, no I/O/0/1."
                  >
                    <input
                      value={code}
                      onChange={(e) =>
                        setCode(e.target.value.toUpperCase().slice(0, 8))
                      }
                      placeholder="K7QM3X9P"
                      className="w-full rounded-lg border border-line/15 bg-surface px-3 py-2.5 text-center font-mono text-xl tracking-[0.4em] text-fg outline-none transition focus:border-neon-cyan/60"
                    />
                  </Field>
                  <button
                    type="submit"
                    disabled={code.length !== 8}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-neon-cyan px-4 py-3 text-sm font-semibold text-ink-900 shadow-glow transition hover:brightness-110 disabled:cursor-not-allowed disabled:bg-surface-3 disabled:text-fg-dim disabled:shadow-none"
                  >
                    Join league
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

          <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-neon-magenta/20 blur-3xl" />
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-fg">My leagues</h2>
            <span className="font-mono text-[11px] uppercase tracking-widest text-fg-dim">
              {MOCK_LEAGUES.length} active
            </span>
          </div>
          <ul className="space-y-3">
            {MOCK_LEAGUES.map((l, i) => (
              <motion.li
                key={l.id}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
                className="group flex items-center gap-4 rounded-2xl border border-line/10 bg-surface-2 p-4 transition hover:border-line/20"
              >
                <div
                  className={`grid h-12 w-12 place-items-center rounded-xl font-display text-lg font-black ${
                    l.myRank === 1
                      ? "bg-neon-lime text-ink-900 shadow-glow"
                      : "bg-surface-3 text-fg"
                  }`}
                >
                  {l.myRank === 1 ? "★" : `#${l.myRank}`}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-fg">{l.name}</p>
                  <p className="text-xs text-fg-muted">
                    {l.memberCount} members · You are #{l.myRank}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => copy(l.code)}
                  className="hidden items-center gap-2 rounded-lg border border-line/10 bg-surface px-3 py-2 font-mono text-xs tracking-[0.3em] transition hover:border-line/30 sm:inline-flex"
                >
                  {copied === l.code ? (
                    <span className="text-emerald-600 dark:text-neon-lime">COPIED</span>
                  ) : (
                    <>
                      <span className="text-fg">{l.code}</span>
                      <span className="text-fg-dim">⧉</span>
                    </>
                  )}
                </button>
              </motion.li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-xs font-medium uppercase tracking-widest text-fg-muted">
          {label}
        </span>
        {hint && <span className="text-[11px] text-fg-dim">{hint}</span>}
      </div>
      {children}
    </label>
  );
}
