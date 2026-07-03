import Link from "next/link";

/** Vinyl-record mark with rainbow grooves and a music note in the label. */
export function LogoMark({ size = 36, spinning = false }: { size?: number; spinning?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-hidden="true"
      className={spinning ? "animate-spin-slow" : undefined}
    >
      <circle cx="32" cy="32" r="30" fill="#27222E" />
      <circle
        cx="32"
        cy="32"
        r="24"
        fill="none"
        stroke="#FF5D73"
        strokeWidth="3.5"
        strokeDasharray="62 89"
        strokeLinecap="round"
        transform="rotate(-30 32 32)"
      />
      <circle
        cx="32"
        cy="32"
        r="18"
        fill="none"
        stroke="#FFB520"
        strokeWidth="3.5"
        strokeDasharray="46 68"
        strokeLinecap="round"
        transform="rotate(85 32 32)"
      />
      <circle
        cx="32"
        cy="32"
        r="12"
        fill="none"
        stroke="#2EC4B6"
        strokeWidth="3.5"
        strokeDasharray="30 46"
        strokeLinecap="round"
        transform="rotate(210 32 32)"
      />
      <circle cx="32" cy="32" r="8" fill="#FFF9F1" />
      {/* eighth note */}
      <ellipse cx="30.4" cy="35.2" rx="2.1" ry="1.7" fill="#27222E" />
      <rect x="31.9" y="27.6" width="1.4" height="7.6" rx="0.7" fill="#27222E" />
      <path d="M33.3 27.6 q2.6 0.6 2.4 3.1 q-0.1 1 -0.9 1.6 q0.5 -2.4 -1.5 -3 z" fill="#27222E" />
    </svg>
  );
}

export function Logo({ size = 34, href = "/" }: { size?: number; href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5 group">
      <LogoMark size={size} />
      <span className="font-display font-extrabold tracking-tight text-xl text-ink whitespace-nowrap">
        Liner Notes<span className="text-coral">.</span>
      </span>
    </Link>
  );
}
