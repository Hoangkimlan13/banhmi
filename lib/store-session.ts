import crypto from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "store_manager_session";

const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 ngày

function getSessionSecret() {
  const secret = process.env.STORE_MANAGER_SESSION_SECRET;

  if (!secret) {
    throw new Error(
      "STORE_MANAGER_SESSION_SECRET is not configured"
    );
  }

  return secret;
}

function sign(payload: string) {
  return crypto
    .createHmac("sha256", getSessionSecret())
    .update(payload)
    .digest("base64url");
}

export function createStoreSession(storeId: number) {
  const payload = JSON.stringify({
    storeId,
    expiresAt: Date.now() + SESSION_MAX_AGE * 1000,
  });

  const encodedPayload = Buffer.from(payload).toString("base64url");
  const signature = sign(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

export function verifyStoreSession(token: string) {
  try {
    const [encodedPayload, signature] = token.split(".");

    if (!encodedPayload || !signature) {
      return null;
    }

    const expectedSignature = sign(encodedPayload);

    const valid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );

    if (!valid) {
      return null;
    }

    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8")
    );

    if (
      typeof payload.storeId !== "number" ||
      typeof payload.expiresAt !== "number"
    ) {
      return null;
    }

    if (payload.expiresAt < Date.now()) {
      return null;
    }

    return {
      storeId: payload.storeId,
      expiresAt: payload.expiresAt,
    };
  } catch {
    return null;
  }
}

export async function getStoreSession() {
  const cookieStore = await cookies();

  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return verifyStoreSession(token);
}

export async function setStoreSession(storeId: number) {
  const cookieStore = await cookies();

  const token = createStoreSession(storeId);

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearStoreSession() {
  const cookieStore = await cookies();

  cookieStore.delete(COOKIE_NAME);
}