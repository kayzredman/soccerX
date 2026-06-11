import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@soccerx/db";
import { getEnv } from "@soccerx/config";

const env = getEnv();
const client = postgres(env.DATABASE_URL, { max: 10, prepare: false });

export const db = drizzle(client, { schema });
export { schema };
export type DB = typeof db;
