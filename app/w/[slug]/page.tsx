import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getUserBySlug, listItems, type Item } from "@/lib/db";
import { Logo, LogoMark } from "@/components/Logo";
import PlayButton from "@/components/PlayButton";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const user = await getUserBySlug(slug);
  if (!user || !user.is_public) return { title: "Liner Notes" };
  const title = user.page_title || (user.name ? `${user.name.split(" ")[0]}'s Liner Notes` : "Liner Notes");
  return {
    title: `${title} — Liner Notes`,
    description: user.intro || "The soundtrack of a life, in their own words.",
  };
}

function Artwork({ item, className }: { item: Item; className: string }) {
  if (item.artwork_url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={item.artwork_url} alt="" className={`${className} object-cover bg-lilac`} />;
  }
  return (
    <div className={`${className} bg-gradient-to-br from-violet to-coral flex items-center justify-center text-white font-extrabold`}>
      ♪
    </div>
  );
}

export default async function PublicPage({ params }: Props) {
  const { slug } = await params;
  const user = await getUserBySlug(slug);
  if (!user || !user.is_public) notFound();

  const items = await listItems(user.id);
  const songs = items.filter((i) => i.kind === "song");
  const albums = items.filter((i) => i.kind === "album");
  const title = user.page_title || (user.name ? `${user.name.split(" ")[0]}'s Liner Notes` : "My Liner Notes");

  return (
    <div className="flex-1">
      {/* Hero */}
      <header className="bg-ink text-cream">
        <div className="max-w-4xl mx-auto px-6 pt-6 pb-14">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 opacity-80 hover:opacity-100">
              <LogoMark size={26} />
              <span className="font-display font-extrabold tracking-tight text-cream">
                Liner Notes<span className="text-coral">.</span>
              </span>
            </Link>
          </div>
          <div className="mt-12 flex items-start gap-5">
            {user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.image} alt="" className="w-16 h-16 rounded-full border-2 border-cream/20" />
            ) : (
              <LogoMark size={64} spinning />
            )}
            <div>
              <h1 className="font-display font-extrabold tracking-tight text-4xl sm:text-5xl leading-tight">
                {title}
              </h1>
              <p className="mt-3 text-cream/50 font-bold text-sm uppercase tracking-widest">
                {songs.length} {songs.length === 1 ? "song" : "songs"}
                {albums.length > 0 && <> · {albums.length} {albums.length === 1 ? "album" : "albums"}</>}
              </p>
            </div>
          </div>
          {user.intro && (
            <p className="mt-8 font-note italic text-xl leading-relaxed text-cream/85 max-w-2xl">
              {user.intro}
            </p>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-14 space-y-20">
        {songs.length > 0 && (
          <section>
            <h2 className="font-display font-extrabold tracking-tight text-3xl">
              My Songs<span className="text-sunshine">.</span>
            </h2>
            <ol className="mt-8 space-y-8">
              {songs.map((item, i) => (
                <li key={item.id} className="flex gap-5">
                  <span className="font-display font-extrabold text-3xl text-coral/70 w-10 text-right shrink-0 leading-none pt-1">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0 border-b border-ink/10 pb-8">
                    <div className="flex items-center gap-4">
                      <Artwork item={item} className="w-16 h-16 rounded-xl shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-lg leading-tight">{item.title}</p>
                        <p className="text-ink-soft">
                          {item.artist}
                          {item.album ? <span className="text-ink-faint"> · {item.album}</span> : null}
                        </p>
                      </div>
                      {item.preview_url && <PlayButton url={item.preview_url} accent="bg-coral" />}
                    </div>
                    {item.note && (
                      <p className="mt-4 font-note italic text-[17px] leading-relaxed text-ink/85">
                        {item.note}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}

        {albums.length > 0 && (
          <section>
            <h2 className="font-display font-extrabold tracking-tight text-3xl">
              My Albums<span className="text-teal">.</span>
            </h2>
            <div className="mt-8 grid sm:grid-cols-2 gap-6">
              {albums.map((item) => (
                <div key={item.id} className="bg-paper rounded-3xl border border-ink/5 shadow-lift p-5">
                  <Artwork item={item} className="w-full aspect-square rounded-2xl text-4xl" />
                  <p className="font-bold text-lg mt-4 leading-tight">{item.title}</p>
                  <p className="text-ink-soft">{item.artist}</p>
                  {item.note && (
                    <p className="mt-3 font-note italic text-[15px] leading-relaxed text-ink/85">{item.note}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {songs.length === 0 && albums.length === 0 && (
          <p className="text-center text-ink-faint font-semibold py-20">
            Nothing here yet — the liner notes are still being written.
          </p>
        )}
      </main>

      <footer className="border-t border-ink/10 py-12 text-center">
        <p className="text-ink-soft font-semibold">Every life has a soundtrack.</p>
        <Link
          href="/"
          className="inline-block mt-4 bg-coral text-white font-bold px-6 py-3 rounded-full hover:bg-coral-deep transition-colors"
        >
          Write your own Liner Notes
        </Link>
        <div className="mt-8 flex justify-center opacity-60">
          <Logo size={22} />
        </div>
      </footer>
    </div>
  );
}
