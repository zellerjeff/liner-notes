import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";

export const metadata: Metadata = {
  title: "Privacy — Liner Notes",
  description: "What Liner Notes collects, why, and how to delete it.",
};

const EFFECTIVE = "November 16, 2026";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-12">
      <h2 className="font-display font-extrabold tracking-tight text-2xl">{title}</h2>
      <div className="mt-4 space-y-4 text-ink-soft leading-relaxed">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  // Set CONTACT_EMAIL in the environment to publish a contact address here.
  const contact = process.env.CONTACT_EMAIL;

  return (
    <div className="flex-1">
      <header className="max-w-3xl mx-auto px-6 py-5">
        <Logo />
      </header>

      <main className="max-w-3xl mx-auto px-6 pt-10 pb-24">
        <h1 className="font-display font-extrabold tracking-tight text-4xl sm:text-5xl">
          Privacy<span className="text-coral">.</span>
        </h1>
        <p className="mt-4 text-ink-faint text-sm font-semibold">Effective {EFFECTIVE}</p>
        <p className="mt-6 text-lg text-ink-soft leading-relaxed">
          Liner Notes — this website and the Liner Notes apps for iPhone, iPad, and Android — keeps
          only what it needs to save your page and show it to the people you share it with. There
          are no ads, no analytics trackers, and nothing is sold.
        </p>

        <Section title="What we collect">
          <p>
            <strong className="text-ink">Your account.</strong>{" "}
            When you sign in with Google or
            Apple we receive your email address, your name, and (from Google) your profile picture.
            If you use Apple&apos;s “Hide My Email”, we receive the relay address Apple creates
            instead. We never see your Google or Apple password.
          </p>
          <p>
            <strong className="text-ink">What you put on your page.</strong> The songs and albums
            you add (title, artist, artwork and preview links, and the link you pasted), the notes
            you write, your page title and intro, your link name, and whether your page is public.
          </p>
          <p>
            <strong className="text-ink">Technical data.</strong>{" "}
            Like any website, our hosting
            provider processes the request details needed to serve pages, such as your IP address
            and browser type. We don&apos;t use them to build a profile of you.
          </p>
        </Section>

        <Section title="How it's used">
          <p>
            To keep you signed in, save your songs, albums, and notes, and display your page. That
            is all. We don&apos;t send marketing email and we don&apos;t share your information
            with advertisers.
          </p>
        </Section>

        <Section title="Who can see your page">
          <p>
            While your page is public, anyone with its link can read it — your name, page title,
            intro, songs, albums, and notes. Your email address is never shown. You can switch your
            page to private at any time, after which only you can open it.
          </p>
        </Section>

        <Section title="Services we rely on">
          <p>
            Liner Notes runs on Vercel (hosting) and Turso (database), which store and process the
            data above on our behalf. Sign-in is handled by Google and Apple.
          </p>
          <p>
            When you paste a Spotify or Apple Music link, our server reads the public details for
            that song, album, or playlist from those services. Artwork and 30-second previews are
            then loaded straight from Spotify&apos;s and Apple&apos;s servers by whoever views your
            page, so those services receive that viewer&apos;s IP address, as they would for any
            embedded content. We never access your Spotify or Apple Music account.
          </p>
        </Section>

        <Section title="Cookies and on-device storage">
          <p>
            The website sets one cookie to keep you signed in. There are no advertising or tracking
            cookies. The apps keep a sign-in token in your device&apos;s secure storage, plus a
            copy of your list and any notes waiting to sync so the app works offline. Signing out
            removes them from the device.
          </p>
        </Section>

        <Section title="Deleting your data">
          <p>
            You can remove any song, album, or note at any time. To delete everything, open the app
            and choose <strong className="text-ink">My Page → Delete account</strong>: your account,
            your page, and all of your songs, albums, and notes are permanently deleted right away.
            {contact ? " You can also ask us to do it for you using the address below." : ""}
          </p>
        </Section>

        <Section title="Children">
          <p>
            Liner Notes is not directed to children under 13, and we don&apos;t knowingly collect
            their information.
          </p>
        </Section>

        <Section title="Changes">
          <p>
            If this policy changes, the new version will be posted here with a new effective date.
          </p>
        </Section>

        {contact && (
          <Section title="Contact">
            <p>
              Questions or requests:{" "}
              <a
                href={`mailto:${contact}`}
                className="font-bold text-ink underline decoration-sunshine decoration-4 underline-offset-4 hover:decoration-coral"
              >
                {contact}
              </a>
            </p>
          </Section>
        )}
      </main>

      <footer className="border-t border-ink/10 py-10">
        <div className="max-w-3xl mx-auto px-6 flex items-center justify-between gap-4">
          <Logo size={26} />
          <Link href="/" className="text-sm font-semibold text-ink-soft hover:text-ink">
            Back to Liner Notes
          </Link>
        </div>
      </footer>
    </div>
  );
}
