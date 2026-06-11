"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

/**
 * Subscribes to the API's live SSE stream. On each `pulse` event,
 * calls router.refresh() so the parent server component re-fetches
 * standings and re-renders. Renders nothing.
 */
export function LiveRefresher({ slug = "wc2026" }: { slug?: string }) {
  const router = useRouter();

  useEffect(() => {
    let es: EventSource | null = null;
    let retry: ReturnType<typeof setTimeout> | null = null;
    let stopped = false;

    function connect() {
      if (stopped) return;
      es = new EventSource(`${BASE}/tournaments/${slug}/live/stream`, {
        withCredentials: false,
      });
      es.addEventListener("pulse", () => router.refresh());
      // snapshot is informational — no refresh needed, page already has fresh data
      es.addEventListener("error", () => {
        es?.close();
        es = null;
        if (!stopped) retry = setTimeout(connect, 4000);
      });
    }

    connect();

    return () => {
      stopped = true;
      if (retry) clearTimeout(retry);
      es?.close();
    };
  }, [router, slug]);

  return null;
}
