import type { FastifyReply, FastifyRequest } from "fastify";
import { eq } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { db, schema } from "./db";
import { verifyClerkToken, clerk } from "./clerk";

export type Session = {
  /** Internal users.id (uuid) */
  sub: string;
  email: string;
  handle: string;
  clerkUserId: string;
};

declare module "fastify" {
  interface FastifyRequest {
    session?: Session;
  }
}

function genHandle(email: string): string {
  const local = email.split("@")[0] ?? "fan";
  const base = local.replace(/[^a-z0-9]/gi, "").toLowerCase();
  const tail = randomBytes(2).toString("hex");
  return `${base.slice(0, 10) || "fan"}_${tail}`;
}

async function ensureUser(
  clerkUserId: string,
  emailHint: string | null,
): Promise<Session> {
  const [existing] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.clerkUserId, clerkUserId))
    .limit(1);

  if (existing) {
    return {
      sub: existing.id,
      email: existing.email,
      handle: existing.handle,
      clerkUserId,
    };
  }

  let email = emailHint;
  let name: string | null = null;
  let image: string | null = null;
  if (!email) {
    const u = await clerk().users.getUser(clerkUserId);
    email =
      u.primaryEmailAddress?.emailAddress ??
      u.emailAddresses[0]?.emailAddress ??
      null;
    name = [u.firstName, u.lastName].filter(Boolean).join(" ") || null;
    image = u.imageUrl ?? null;
  }
  if (!email) {
    throw new Error(`Clerk user ${clerkUserId} has no email`);
  }

  const [byEmail] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .limit(1);

  if (byEmail) {
    const [linked] = await db
      .update(schema.users)
      .set({
        clerkUserId,
        name: name ?? byEmail.name,
        image: image ?? byEmail.image,
      })
      .where(eq(schema.users.id, byEmail.id))
      .returning();
    const u = linked ?? byEmail;
    return { sub: u.id, email: u.email, handle: u.handle, clerkUserId };
  }

  const [created] = await db
    .insert(schema.users)
    .values({
      clerkUserId,
      email,
      handle: genHandle(email),
      name,
      image,
    })
    .returning();
  if (!created) throw new Error("Failed to create user");
  return {
    sub: created.id,
    email: created.email,
    handle: created.handle,
    clerkUserId,
  };
}

function extractToken(req: FastifyRequest): string | null {
  const header = req.headers.authorization;
  if (header && header.toLowerCase().startsWith("bearer ")) {
    return header.slice(7).trim();
  }
  return null;
}

export async function requireSession(
  req: FastifyRequest,
  reply: FastifyReply,
): Promise<Session | null> {
  const token = extractToken(req);
  if (!token) {
    reply.code(401).send({ error: "Missing session" });
    return null;
  }
  try {
    const claims = await verifyClerkToken(token);
    if (!claims.clerkUserId) {
      reply.code(401).send({ error: "Invalid token" });
      return null;
    }
    const session = await ensureUser(claims.clerkUserId, claims.email);
    req.session = session;
    return session;
  } catch (err) {
    req.log.warn({ err }, "session verify failed");
    reply.code(401).send({ error: "Invalid session" });
    return null;
  }
}
