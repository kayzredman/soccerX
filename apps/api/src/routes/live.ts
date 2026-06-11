import type { FastifyInstance } from "fastify";
import { and, eq, gte } from "drizzle-orm";
import { db, schema } from "../db";

const { tournaments, matches } = schema;

/**
 * Server-Sent Events stream for live match updates.
 *
 * Behaviour:
 *  - On connect: emits a `snapshot` event with the current LIVE matches.
 *  - Every ~3s: re-queries; if any LIVE-relevant row mutated (status, score,
 *    finish time), emits a `pulse` event. Clients use that signal to call
 *    `router.refresh()` and re-render server components.
 *  - Heartbeat every 25s to keep proxies from killing idle connections.
 */
export async function liveRoutes(app: FastifyInstance) {
  app.get<{ Params: { slug: string } }>(
    "/tournaments/:slug/live/stream",
    async (req, reply) => {
      const [t] = await db
        .select()
        .from(tournaments)
        .where(eq(tournaments.slug, req.params.slug))
        .limit(1);
      if (!t) return reply.code(404).send({ error: "Not found" });
      const tournamentId = t.id;

      const raw = reply.raw;
      raw.statusCode = 200;
      raw.setHeader("content-type", "text/event-stream");
      raw.setHeader("cache-control", "no-cache, no-transform");
      raw.setHeader("connection", "keep-alive");
      raw.setHeader("x-accel-buffering", "no");
      // Mirror CORS for EventSource (browser sends Origin)
      const origin = req.headers.origin;
      if (origin) {
        raw.setHeader("access-control-allow-origin", origin);
        raw.setHeader("access-control-allow-credentials", "true");
      }
      raw.flushHeaders?.();

      const send = (event: string, data: unknown) => {
        raw.write(`event: ${event}\n`);
        raw.write(`data: ${JSON.stringify(data)}\n\n`);
      };

      type LiveSnap = {
        id: string;
        status: string;
        homeScore: number | null;
        awayScore: number | null;
        kickoffAt: string;
      };

      async function loadLive(): Promise<LiveSnap[]> {
        const recentWindow = new Date(Date.now() - 6 * 60 * 60 * 1000); // 6h
        const rows = await db
          .select({
            id: matches.id,
            status: matches.status,
            homeScore: matches.homeScore,
            awayScore: matches.awayScore,
            kickoffAt: matches.kickoffAt,
            settledAt: matches.settledAt,
          })
          .from(matches)
          .where(
            and(
              eq(matches.tournamentId, tournamentId),
              gte(matches.kickoffAt, recentWindow),
            ),
          );
        return rows
          .filter(
            (r) =>
              r.status === "LIVE" ||
              (r.status === "FINISHED" &&
                r.settledAt &&
                r.settledAt.getTime() > Date.now() - 60_000),
          )
          .map((r) => ({
            id: r.id,
            status: r.status,
            homeScore: r.homeScore,
            awayScore: r.awayScore,
            kickoffAt: r.kickoffAt.toISOString(),
          }));
      }

      const signature = (snaps: LiveSnap[]) =>
        snaps
          .map(
            (s) => `${s.id}:${s.status}:${s.homeScore ?? "_"}:${s.awayScore ?? "_"}`,
          )
          .sort()
          .join("|");

      let last = await loadLive();
      send("snapshot", { matches: last, at: new Date().toISOString() });

      const interval = setInterval(async () => {
        try {
          const current = await loadLive();
          if (signature(current) !== signature(last)) {
            last = current;
            send("pulse", { matches: current, at: new Date().toISOString() });
          }
        } catch (err) {
          req.log.warn({ err }, "live stream poll failed");
        }
      }, 3000);

      const heartbeat = setInterval(() => {
        raw.write(`: ping ${Date.now()}\n\n`);
      }, 25_000);

      const close = () => {
        clearInterval(interval);
        clearInterval(heartbeat);
        try {
          raw.end();
        } catch {
          // already closed
        }
      };

      req.raw.on("close", close);
      req.raw.on("error", close);

      // Keep handler open — we manage the response manually
      return reply;
    },
  );
}
