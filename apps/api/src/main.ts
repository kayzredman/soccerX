import Fastify from "fastify";
import { getEnv } from "@soccerx/config";
import { healthRoutes } from "./routes/health";
import { tournamentRoutes } from "./routes/tournaments";
import { standingsRoutes } from "./routes/standings";
import { liveRoutes } from "./routes/live";
import { picksRoutes } from "./routes/picks";
import { leaguesRoutes } from "./routes/leagues";
import { leaderboardRoutes } from "./routes/leaderboard";

async function bootstrap() {
  const env = getEnv();

  const app = Fastify({
    logger: { level: env.NODE_ENV === "production" ? "info" : "debug" },
  });

  const origins = env.API_CORS_ORIGINS.split(",").map((s) => s.trim());
  app.addHook("onRequest", async (req, reply) => {
    const origin = req.headers.origin;
    if (origin && origins.includes(origin)) {
      reply.header("access-control-allow-origin", origin);
      reply.header("access-control-allow-credentials", "true");
      reply.header(
        "access-control-allow-headers",
        "authorization, content-type",
      );
      reply.header("access-control-allow-methods", "GET, POST, OPTIONS");
    }
    if (req.method === "OPTIONS") {
      reply.code(204).send();
    }
  });

  await app.register(healthRoutes);
  await app.register(tournamentRoutes);
  await app.register(standingsRoutes);
  await app.register(liveRoutes);
  await app.register(picksRoutes);
  await app.register(leaguesRoutes);
  await app.register(leaderboardRoutes);

  try {
    const address = await app.listen({ port: env.API_PORT, host: "0.0.0.0" });
    console.log(`[soccerx/api] listening on ${address}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

bootstrap().catch((err) => {
  console.error("[soccerx/api] failed to start", err);
  process.exit(1);
});
