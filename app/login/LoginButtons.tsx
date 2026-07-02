"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export default function LoginButtons({
  googleEnabled,
  demoEnabled,
}: {
  googleEnabled: boolean;
  demoEnabled: boolean;
}) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState<"google" | "demo" | null>(null);

  return (
    <div className="space-y-6">
      {googleEnabled && (
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => {
            setBusy("google");
            void signIn("google", { redirectTo: "/me" });
          }}
          className="w-full flex items-center justify-center gap-3 bg-ink text-cream font-bold px-5 py-3.5 rounded-full hover:bg-coral transition-colors disabled:opacity-60 cursor-pointer"
        >
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
            <path
              fill="#FFC107"
              d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.3 6 29.4 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z"
            />
            <path
              fill="#FF3D00"
              d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.3 6 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
            />
            <path
              fill="#4CAF50"
              d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
            />
            <path
              fill="#1976D2"
              d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C41.4 34.9 44 30 44 24c0-1.3-.1-2.6-.4-3.9z"
            />
          </svg>
          {busy === "google" ? "Opening Google…" : "Continue with Google"}
        </button>
      )}

      {googleEnabled && demoEnabled && (
        <div className="flex items-center gap-3 text-ink-faint text-xs font-bold uppercase tracking-widest">
          <div className="h-px bg-ink/10 flex-1" />
          or
          <div className="h-px bg-ink/10 flex-1" />
        </div>
      )}

      {demoEnabled && (
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            setBusy("demo");
            void signIn("demo", { name, redirectTo: "/me" });
          }}
        >
          <label className="block text-sm font-bold" htmlFor="demo-name">
            Try it with just a name
          </label>
          <input
            id="demo-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Jeff"
            required
            className="w-full rounded-xl border-2 border-ink/10 bg-cream px-4 py-3 font-semibold outline-none focus:border-teal"
          />
          <button
            type="submit"
            disabled={busy !== null}
            className="w-full bg-teal text-white font-bold px-5 py-3.5 rounded-full hover:bg-teal-deep transition-colors disabled:opacity-60 cursor-pointer"
          >
            {busy === "demo" ? "Signing in…" : "Continue in demo mode"}
          </button>
        </form>
      )}
    </div>
  );
}
