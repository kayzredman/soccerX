import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { getEnv } from "@soccerx/config";
import { AppModule } from "./app.module";

async function bootstrap() {
  const env = getEnv();
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: true }),
  );

  app.enableCors({
    origin: env.API_CORS_ORIGINS.split(",").map((s) => s.trim()),
    credentials: true,
  });

  await app.listen(env.API_PORT, "0.0.0.0");
  // eslint-disable-next-line no-console
  console.log(`[soccerx/api] listening on :${env.API_PORT}`);
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("[soccerx/api] failed to start", err);
  process.exit(1);
});
