import Link from "next/link";
import { auth } from "@/auth";
import { Logo, LogoMark } from "@/components/Logo";

const sampleSongs = [
  {
    title: "September",
    artist: "Earth, Wind & Fire",
    art: "from-sunshine to-coral",
    note: "Played at our wedding. Nobody sat down for four straight minutes.",
    rotate: "-rotate-2",
  },
  {
    title: "Fast Car",
    artist: "Tracy Chapman",
    art: "from-teal to-violet",
    note: "Summer of '89, windows down on I-80. This one is your grandmother's fault.",
    rotate: "rotate-1",
  },
  {
    title: "Here Comes the Sun",
    artist: "The Beatles",
    art: "from-violet to-coral",
    note: "The song I hummed to each of you kids at 3am. It worked about half the time.",
    rotate: "-rotate-1",
  },
];

const steps = [
  {
    n: "1",
    color: "bg-coral",
    tint: "bg-blush",
    title: "Paste a link",
    body: "Drop in a Spotify or Apple Music playlist, song, or album link. We pull in the titles, artists, and artwork for you.",
  },
  {
    n: "2",
    color: "bg-sunshine",
    tint: "bg-butter",
    title: "Write the story",
    body: "Every song gets a note: the road trip, the slow dance, the kitchen radio. That's the part no algorithm can generate.",
  },
  {
    n: "3",
    color: "bg-teal",
    tint: "bg-mint",
    title: "Share your page",
    body: "You get one clean, personal link. Send it to your family, your friends, or the group chat that argues about music.",
  },
];

function FloatingNote({ className, color, delay }: { className: string; color: string; delay: string }) {
  return (
    <div className={`absolute animate-bob ${className}`} style={{ animationDelay: delay }} aria-hidden="true">
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
        <path
          d="M9 18V6l10-2v11"
          stroke={color}
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="6.5" cy="18" r="2.8" fill={color} />
        <circle cx="16.5" cy="15" r="2.8" fill={color} />
      </svg>
    </div>
  );
}

export default async function Home() {
  const session = await auth();
  const cta = session ? "/me" : "/login";
  const ctaLabel = session ? "Go to my page" : "Start your page";

  return (
    <div className="flex-1">
      <header className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <Logo />
        <nav className="flex items-center gap-6">
          <a href="#how" className="hidden sm:block text-sm font-semibold text-ink-soft hover:text-ink">
            How it works
          </a>
          <Link
            href={cta}
            className="text-sm font-bold bg-ink text-cream px-4 py-2 rounded-full hover:bg-coral transition-colors"
          >
            {session ? "My page" : "Sign in"}
          </Link>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section className="relative max-w-6xl mx-auto px-6 pt-14 pb-24 overflow-hidden">
          <FloatingNote className="top-10 left-[4%] hidden md:block" color="#FFB520" delay="0s" />
          <FloatingNote className="top-64 left-[38%] hidden lg:block opacity-60" color="#FF5D73" delay="1.2s" />
          <FloatingNote className="bottom-8 left-[12%] hidden md:block opacity-70" color="#7B6EF6" delay="2s" />

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="inline-block text-xs font-bold uppercase tracking-widest bg-lilac text-violet-deep px-3 py-1.5 rounded-full mb-6">
                Your musical living will
              </span>
              <h1 className="font-display font-extrabold tracking-tight text-5xl sm:text-6xl leading-[1.05]">
                The soundtrack of your life,{" "}
                <span className="text-coral">in your own words.</span>
              </h1>
              <p className="mt-6 text-lg text-ink-soft max-w-xl leading-relaxed">
                Spotify Wrapped tells people what you streamed. Liner Notes tells them why it
                mattered. Import the songs and albums that made you <em className="font-note">you</em>,
                write the story behind each one, and share a single page that says more than any bio.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-4">
                <Link
                  href={cta}
                  className="bg-coral text-white font-bold px-7 py-3.5 rounded-full text-lg shadow-lift hover:bg-coral-deep transition-colors"
                >
                  {ctaLabel}
                </Link>
                <a href="#how" className="font-bold text-ink underline decoration-sunshine decoration-4 underline-offset-4 hover:decoration-coral">
                  See how it works
                </a>
              </div>
              <p className="mt-5 text-sm text-ink-faint">
                Works with Spotify and Apple Music links. Free to use.
              </p>
            </div>

            {/* Sample card stack */}
            <div className="relative">
              <div className="absolute -top-10 -right-4 hidden sm:block">
                <LogoMark size={92} spinning />
              </div>
              <div className="space-y-4">
                {sampleSongs.map((s, i) => (
                  <div
                    key={s.title}
                    className={`bg-paper rounded-2xl p-4 shadow-lift border border-ink/5 flex gap-4 ${s.rotate}`}
                  >
                    <div
                      className={`w-14 h-14 rounded-xl bg-gradient-to-br ${s.art} shrink-0 flex items-center justify-center text-white font-extrabold text-xl`}
                    >
                      {i + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold leading-tight">{s.title}</p>
                      <p className="text-sm text-ink-soft">{s.artist}</p>
                      <p className="font-note italic text-[15px] text-ink/80 mt-1.5 leading-snug">
                        “{s.note}”
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="bg-ink text-cream py-24">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="font-display font-extrabold tracking-tight text-4xl sm:text-5xl text-center">
              Three steps. One keepsake.
            </h2>
            <p className="text-center mt-4 text-cream/60 text-lg">No uploading files, no typing out track lists.</p>
            <div className="grid md:grid-cols-3 gap-6 mt-14">
              {steps.map((s) => (
                <div key={s.n} className={`${s.tint} text-ink rounded-3xl p-8`}>
                  <div
                    className={`${s.color} w-11 h-11 rounded-full text-white font-extrabold text-lg flex items-center justify-center`}
                  >
                    {s.n}
                  </div>
                  <h3 className="font-display font-extrabold text-2xl mt-5">{s.title}</h3>
                  <p className="mt-3 text-ink-soft leading-relaxed">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why */}
        <section className="max-w-4xl mx-auto px-6 py-24 text-center">
          <h2 className="font-display font-extrabold tracking-tight text-4xl sm:text-5xl">
            More than a playlist<span className="text-teal">.</span>
          </h2>
          <p className="mt-6 text-lg text-ink-soft leading-relaxed">
            A playlist is a list of songs. This is a record of taste, memory, and the moments in
            between — the album you wore out in college, the song from the hospital waiting room,
            the one you want played loud when people gather in your honor. Write it down while the
            stories are still yours to tell.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3 text-sm font-bold">
            <span className="bg-blush text-coral-deep px-4 py-2 rounded-full">My Songs, annotated</span>
            <span className="bg-mint text-teal-deep px-4 py-2 rounded-full">My Albums, front to back</span>
            <span className="bg-butter text-sunshine-deep px-4 py-2 rounded-full">One shareable link</span>
            <span className="bg-lilac text-violet-deep px-4 py-2 rounded-full">30-second previews</span>
          </div>
          <Link
            href={cta}
            className="inline-block mt-12 bg-ink text-cream font-bold px-8 py-4 rounded-full text-lg hover:bg-coral transition-colors"
          >
            {ctaLabel}
          </Link>
        </section>
      </main>

      <footer className="border-t border-ink/10 py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo size={26} />
          <p className="text-sm text-ink-faint">Made for the songs that made you.</p>
        </div>
      </footer>
    </div>
  );
}
