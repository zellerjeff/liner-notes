"use client";

import { useEffect, useRef, useState } from "react";

let activeAudio: HTMLAudioElement | null = null;
let activeStop: (() => void) | null = null;

/** 30-second preview player. Only one preview plays at a time. */
export default function PlayButton({ url, accent = "bg-ink" }: { url: string; accent?: string }) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        if (activeAudio === audioRef.current) {
          activeAudio = null;
          activeStop = null;
        }
      }
    };
  }, []);

  function toggle() {
    if (playing) {
      audioRef.current?.pause();
      setPlaying(false);
      return;
    }
    activeStop?.();
    if (!audioRef.current) {
      audioRef.current = new Audio(url);
      audioRef.current.addEventListener("ended", () => setPlaying(false));
    }
    activeAudio = audioRef.current;
    activeStop = () => {
      audioRef.current?.pause();
      setPlaying(false);
    };
    audioRef.current.currentTime = 0;
    void audioRef.current.play().catch(() => setPlaying(false));
    setPlaying(true);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      title={playing ? "Stop preview" : "Play 30-second preview"}
      className={`shrink-0 w-8 h-8 rounded-full ${accent} text-white flex items-center justify-center transition-transform hover:scale-110 cursor-pointer`}
    >
      {playing ? (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" aria-hidden="true">
          <rect x="1" y="1" width="8" height="8" rx="1.5" />
        </svg>
      ) : (
        <svg width="11" height="12" viewBox="0 0 11 12" fill="currentColor" aria-hidden="true">
          <path d="M1.5 1.3a1 1 0 0 1 1.5-.87l7 4.7a1 1 0 0 1 0 1.73l-7 4.7a1 1 0 0 1-1.5-.86z" />
        </svg>
      )}
      <span className="sr-only">{playing ? "Stop preview" : "Play preview"}</span>
    </button>
  );
}
