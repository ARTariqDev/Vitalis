import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const secret = new TextEncoder().encode(process.env.secret_word);

async function createJWT(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(secret);
}

export async function createSession(payload) {
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  const session = await createJWT({ ...payload, expiresAt });
  const c = await cookies();
  c.set("session", session, {
    httpOnly: true,
    expires: expiresAt,
    secure: process.env.NODE_ENV === "production", // Only secure in production
    sameSite: "lax",
  });
}

export async function verifyJWT(session) {
  try {
    const { payload } = await jwtVerify(session, secret, {
      algorithms: ["HS256"],
    });
    return payload;
  } catch (error) {
    console.error("Failed to verify session");
    console.log(error);
    return null;
  }
}

// in case we want to log out
export async function deleteSession() {
  const c = await cookies();
  c.delete("session");
}
