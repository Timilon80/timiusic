import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { getUserById } from "@/lib/db";
import { getSessionSecret } from "@/lib/env";
import type { SessionUser } from "@/lib/types";

const cookieName = "timiusic_session";

function getSecret() {
  return new TextEncoder().encode(getSessionSecret());
}

type SessionPayload = {
  userId: number;
};

export async function createSessionCookie(userId: number) {
  const token = await new SignJWT({ userId } satisfies SessionPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecret());

  const cookieStore = await cookies();
  cookieStore.set(cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(cookieName);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(cookieName)?.value;

  if (!token) {
    return null;
  }

  try {
    const verified = await jwtVerify(token, getSecret());
    const payload = verified.payload as SessionPayload;
    return getUserById(payload.userId);
  } catch {
    return null;
  }
}

export async function requireSession() {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }

  return user;
}

export async function requireAdmin() {
  const user = await requireSession();

  if (user.role !== "admin") {
    throw new Error("FORBIDDEN");
  }

  return user;
}
