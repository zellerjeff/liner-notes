import { headers } from "next/headers";
import { auth } from "@/auth";
import { getUserById, type User } from "@/lib/db";
import { verifyMobileToken } from "@/lib/mobileAuth";

/**
 * Resolve the signed-in database user, or null.
 * Accepts the browser's session cookie or a mobile `Authorization: Bearer` token.
 */
export async function currentUser(): Promise<User | null> {
  const authorization = (await headers()).get("authorization");
  if (authorization?.toLowerCase().startsWith("bearer ")) {
    const uid = await verifyMobileToken(authorization.slice(7).trim());
    if (uid === null) return null;
    return (await getUserById(uid)) ?? null;
  }
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;
  return (await getUserById(Number(id))) ?? null;
}
