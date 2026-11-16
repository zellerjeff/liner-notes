import { createRemoteJWKSet, jwtVerify, SignJWT } from "jose";

// Token auth for the native mobile apps. The app signs in with Google or Apple
// natively, posts the resulting ID token to /api/mobile/auth, and gets back a
// long-lived JWT (HS256, AUTH_SECRET) that it sends as `Authorization: Bearer`.

const GOOGLE_JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));
const APPLE_JWKS = createRemoteJWKSet(new URL("https://appleid.apple.com/auth/keys"));

const TOKEN_ISSUER = "liner-notes";
const TOKEN_AUDIENCE = "liner-notes-mobile";
const TOKEN_TTL = "180d";

function secret(): Uint8Array {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(s);
}

export type VerifiedIdentity = {
  email: string;
  name: string | null;
  image: string | null;
};

// `aud` values we accept on Google ID tokens: the web client ID plus the
// iOS/Android client IDs (comma-separated in GOOGLE_MOBILE_CLIENT_IDS).
function googleAudiences(): string[] {
  return [process.env.AUTH_GOOGLE_ID, ...(process.env.GOOGLE_MOBILE_CLIENT_IDS || "").split(",")]
    .map((s) => s?.trim())
    .filter((s): s is string => !!s);
}

function appleAudiences(): string[] {
  return (process.env.APPLE_APP_BUNDLE_ID || "com.linernotes.app")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function verifyGoogleIdToken(idToken: string): Promise<VerifiedIdentity> {
  const audience = googleAudiences();
  if (audience.length === 0) throw new Error("No Google client IDs configured.");
  const { payload } = await jwtVerify(idToken, GOOGLE_JWKS, {
    issuer: ["https://accounts.google.com", "accounts.google.com"],
    audience,
  });
  const email = typeof payload.email === "string" ? payload.email : "";
  const verified = payload.email_verified === true || payload.email_verified === "true";
  if (!email || !verified) throw new Error("Google account has no verified email.");
  return {
    email,
    name: typeof payload.name === "string" ? payload.name : null,
    image: typeof payload.picture === "string" ? payload.picture : null,
  };
}

export async function verifyAppleIdToken(idToken: string): Promise<VerifiedIdentity> {
  const { payload } = await jwtVerify(idToken, APPLE_JWKS, {
    issuer: "https://appleid.apple.com",
    audience: appleAudiences(),
  });
  const email = typeof payload.email === "string" ? payload.email : "";
  if (!email) throw new Error("Apple sign-in returned no email.");
  // Apple sends the user's name only to the client, and only once — the app
  // passes it along in the request body; the ID token itself has no name.
  return { email, name: null, image: null };
}

export async function mintMobileToken(userId: number): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(userId))
    .setIssuer(TOKEN_ISSUER)
    .setAudience(TOKEN_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(TOKEN_TTL)
    .sign(secret());
}

/** Returns the user id a valid mobile token names, or null. */
export async function verifyMobileToken(token: string): Promise<number | null> {
  try {
    const { payload } = await jwtVerify(token, secret(), {
      issuer: TOKEN_ISSUER,
      audience: TOKEN_AUDIENCE,
      algorithms: ["HS256"],
    });
    const uid = Number(payload.sub);
    return Number.isInteger(uid) && uid > 0 ? uid : null;
  } catch {
    return null;
  }
}
