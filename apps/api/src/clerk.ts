import { createClerkClient, verifyToken } from "@clerk/backend";
import { getEnv } from "@soccerx/config";

const env = getEnv();

let _client: ReturnType<typeof createClerkClient> | null = null;
export function clerk() {
  if (_client) return _client;
  if (!env.CLERK_SECRET_KEY) {
    throw new Error("CLERK_SECRET_KEY missing");
  }
  _client = createClerkClient({ secretKey: env.CLERK_SECRET_KEY });
  return _client;
}

export type ClerkClaims = {
  clerkUserId: string;
  email: string | null;
};

export async function verifyClerkToken(token: string): Promise<ClerkClaims> {
  const payload = await verifyToken(token, {
    secretKey: env.CLERK_SECRET_KEY,
  });
  return {
    clerkUserId: String(payload.sub ?? ""),
    email: (payload.email as string | undefined) ?? null,
  };
}
