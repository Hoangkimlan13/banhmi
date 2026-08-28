import crypto from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "store_manager_session";

const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7日

// ============================================================
// SECRET
// ============================================================

function getSessionSecret(): string {
  const secret = process.env.STORE_MANAGER_SESSION_SECRET;

  if (!secret) {
    throw new Error(
      "STORE_MANAGER_SESSION_SECRET is not configured"
    );
  }

  return secret;
}

// ============================================================
// SIGN
// ============================================================

function sign(payload: string): string {
  return crypto
    .createHmac("sha256", getSessionSecret())
    .update(payload)
    .digest("base64url");
}

// ============================================================
// CREATE SESSION
// ============================================================

export function createStoreSession(
  storeId: number
): string {
  const payload = JSON.stringify({
    storeId,
    expiresAt:
      Date.now() +
      SESSION_MAX_AGE * 1000,
  });

  const encodedPayload =
    Buffer.from(payload).toString("base64url");

  const signature =
    sign(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

// ============================================================
// VERIFY SESSION
// ============================================================

export function verifyStoreSession(
  token: string
) {
  try {
    const parts = token.split(".");

    if (parts.length !== 2) {
      return null;
    }

    const [
      encodedPayload,
      signature,
    ] = parts;

    if (
      !encodedPayload ||
      !signature
    ) {
      return null;
    }

    const expectedSignature =
      sign(encodedPayload);

    const signatureBuffer =
      Buffer.from(signature);

    const expectedBuffer =
      Buffer.from(expectedSignature);

    // timingSafeEqual sẽ throw nếu length khác nhau
    if (
      signatureBuffer.length !==
      expectedBuffer.length
    ) {
      return null;
    }

    const valid =
      crypto.timingSafeEqual(
        signatureBuffer,
        expectedBuffer
      );

    if (!valid) {
      return null;
    }

    const payload = JSON.parse(
      Buffer.from(
        encodedPayload,
        "base64url"
      ).toString("utf8")
    );

    if (
      typeof payload.storeId !==
        "number" ||
      typeof payload.expiresAt !==
        "number"
    ) {
      return null;
    }

    if (
      payload.storeId <= 0 ||
      !Number.isInteger(
        payload.storeId
      )
    ) {
      return null;
    }

    if (
      payload.expiresAt <= Date.now()
    ) {
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

// ============================================================
// GET SESSION
// ============================================================

export async function getStoreSession() {
  const cookieStore =
    await cookies();

  const token =
    cookieStore.get(
      COOKIE_NAME
    )?.value;

  if (!token) {
    return null;
  }

  return verifyStoreSession(token);
}

// ============================================================
// SET SESSION
// ============================================================

export async function setStoreSession(
  storeId: number
) {
  if (
    !Number.isInteger(storeId) ||
    storeId <= 0
  ) {
    throw new Error(
      "Invalid storeId"
    );
  }

  const cookieStore =
    await cookies();

  const token =
    createStoreSession(storeId);

  cookieStore.set(
    COOKIE_NAME,
    token,
    {
      httpOnly: true,

      secure:
        process.env.NODE_ENV ===
        "production",

      sameSite: "lax",

      path: "/",

      maxAge: SESSION_MAX_AGE,
    }
  );
}

// ============================================================
// CLEAR SESSION
// ============================================================

export async function clearStoreSession() {
  const cookieStore =
    await cookies();

  cookieStore.delete(
    COOKIE_NAME
  );
}