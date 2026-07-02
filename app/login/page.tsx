import { redirect } from "next/navigation";
import { auth, googleEnabled, demoEnabled } from "@/auth";
import { Logo } from "@/components/Logo";
import LoginButtons from "./LoginButtons";

export const metadata = { title: "Sign in — Liner Notes" };

export default async function LoginPage() {
  const session = await auth();
  if (session) redirect("/me");

  return (
    <div className="flex-1 flex flex-col">
      <header className="max-w-6xl w-full mx-auto px-6 py-5">
        <Logo />
      </header>
      <main className="flex-1 flex items-center justify-center px-6 pb-24">
        <div className="w-full max-w-md">
          <div className="bg-paper rounded-3xl shadow-lift border border-ink/5 p-8 sm:p-10">
            <h1 className="font-display font-extrabold tracking-tight text-3xl">
              Welcome back<span className="text-coral">.</span>
            </h1>
            <p className="mt-2 text-ink-soft">
              Sign in to build and edit your page. Your liner notes are yours alone until you share
              the link.
            </p>
            <div className="mt-8">
              <LoginButtons googleEnabled={googleEnabled} demoEnabled={demoEnabled} />
            </div>
          </div>
          {!googleEnabled && (
            <p className="text-xs text-ink-faint mt-4 text-center leading-relaxed">
              Google sign-in isn&apos;t configured yet — demo mode stores accounts by name on this
              machine. See the README to enable Google login.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
