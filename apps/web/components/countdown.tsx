"use client";

import { useEffect, useState } from "react";

function diff(target: Date) {
  const ms = Math.max(0, target.getTime() - Date.now());
  const s = Math.floor(ms / 1000);
  return {
    d: Math.floor(s / 86400),
    h: Math.floor((s % 86400) / 3600),
    m: Math.floor((s % 3600) / 60),
    s: s % 60,
    done: ms === 0,
  };
}

export function Countdown({ iso }: { iso: string }) {
  const target = new Date(iso);
  const [t, setT] = useState(() => diff(target));

  useEffect(() => {
    const id = setInterval(() => setT(diff(target)), 1000);
    return () => clearInterval(id);
  }, [iso]);

  if (t.done) {
    return (
      <div className="font-mono text-sm uppercase tracking-widest text-neon-lime animate-pulseSoft">
        ● Live
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 font-mono">
      <Unit n={t.d} label="D" />
      <Sep />
      <Unit n={t.h} label="H" />
      <Sep />
      <Unit n={t.m} label="M" />
      <Sep />
      <Unit n={t.s} label="S" />
    </div>
  );
}

function Unit({ n, label }: { n: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="min-w-[3.25rem] rounded-lg border border-line/10 bg-surface-2 px-3 py-2 text-center text-2xl font-bold tabular-nums text-fg shadow-ring sm:text-3xl">
        {String(n).padStart(2, "0")}
      </div>
      <div className="mt-1 text-[10px] uppercase tracking-widest text-fg-dim">
        {label}
      </div>
    </div>
  );
}

function Sep() {
  return <div className="text-2xl text-fg-dim sm:text-3xl">:</div>;
}
