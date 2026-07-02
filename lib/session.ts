import { auth } from "@/auth";
import { getUserById, type User } from "@/lib/db";

/** Resolve the signed-in database user, or null. */
export async function currentUser(): Promise<User | null> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;
  return (await getUserById(Number(id))) ?? null;
}
