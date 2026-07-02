import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import type { Provider } from "next-auth/providers";
import { upsertUser } from "@/lib/db";

export const googleEnabled = !!(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
// Demo (name-only) login: explicit opt-in, or the local-dev fallback when Google
// isn't configured. Never implicitly enabled in production.
export const demoEnabled =
  process.env.ALLOW_DEMO_LOGIN === "1" ||
  (!googleEnabled && process.env.NODE_ENV !== "production");

const providers: Provider[] = [];

if (googleEnabled) providers.push(Google);

if (demoEnabled) {
  providers.push(
    Credentials({
      id: "demo",
      name: "Demo",
      credentials: { name: { label: "Your name" } },
      async authorize(credentials) {
        const name = String(credentials?.name || "").trim().slice(0, 60) || "Demo Listener";
        const handle =
          name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "") || "demo";
        return { id: `demo:${handle}`, name, email: `${handle}@demo.linernotes.local` };
      },
    })
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.email) {
        const dbUser = await upsertUser(user.email, user.name, user.image);
        token.uid = dbUser.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.uid) {
        session.user.id = String(token.uid);
      }
      return session;
    },
  },
});
