"use client";

import { Pause, Play, SkipForward, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { Track } from "@/lib/audio";

const KEY = "animus-archive:audio";
/** Background music sits well under the page; the visitor's own volume does the rest. */
const DEFAULT_VOLUME = 0.07;

interface Saved {
  muted?: boolean;
  index?: number;
  volume?: number;
}

/**
 * Saved preferences as an external store, so they are read after hydration
 * (the server can't know them) without a flash of the wrong icon. Storage can
 * be blocked — private mode, cleared site data — and the player works without it.
 */
const EMPTY: Saved = {};
let state: Saved | null = null;
const listeners = new Set<() => void>();

function getSnapshot(): Saved {
  if (!state) {
    try {
      const raw = window.localStorage.getItem(KEY);
      const parsed: unknown = raw ? JSON.parse(raw) : null;
      state = parsed && typeof parsed === "object" ? (parsed as Saved) : EMPTY;
    } catch {
      state = EMPTY;
    }
  }
  return state;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function update(patch: Saved) {
  state = { ...getSnapshot(), ...patch };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Preferences just won't persist.
  }
  listeners.forEach((l) => l());
}

/**
 * Background soundtrack in the header. It starts on its own where the browser
 * allows it; where autoplay is blocked — most browsers, until the visitor has
 * interacted with the site — it starts on their first click, key or scroll.
 * A deliberate pause is never overridden.
 *
 * The header lives in the root layout, so playback continues across navigation.
 */
export function MusicPlayer({ tracks }: { tracks: Track[] }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const pausedByUser = useRef(false);
  const [playing, setPlaying] = useState(false);
  const prefs = useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);

  const count = tracks.length;
  const index = count ? Math.min(Math.max(prefs.index ?? 0, 0), count - 1) : 0;
  const muted = !!prefs.muted;
  const volume = Math.min(Math.max(prefs.volume ?? DEFAULT_VOLUME, 0), 1);

  // Start on mount and whenever the track changes; fall back to the first gesture.
  useEffect(() => {
    const a = audioRef.current;
    if (!a || !count || pausedByUser.current) return;

    const gestures = new AbortController();
    void a.play().catch(() => {
      const onGesture = () => {
        gestures.abort();
        if (!pausedByUser.current) void a.play().catch(() => {});
      };
      for (const event of ["pointerdown", "keydown", "touchstart", "wheel"]) {
        document.addEventListener(event, onGesture, { signal: gestures.signal, passive: true });
      }
    });

    return () => gestures.abort();
  }, [index, count]);

  // Volume and muted are element properties, not attributes React can set.
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.volume = volume;
    a.muted = muted;
  }, [volume, muted]);

  if (!count) return null;

  const track = tracks[index];
  const next = () => {
    pausedByUser.current = false;
    update({ index: (index + 1) % count });
  };

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      pausedByUser.current = false;
      void a.play().catch(() => {});
    } else {
      pausedByUser.current = true;
      a.pause();
    }
  };

  const btn = "grid size-7 shrink-0 place-items-center text-bone-dim transition-colors hover:text-bone";

  return (
    <div className="flex items-center gap-0.5 border border-line-strong/60 bg-ink-950/40 px-1 py-0.5 backdrop-blur-sm sm:gap-1 sm:px-1.5">
      <audio ref={audioRef} src={track.src} preload="auto" onEnded={next} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} />

      <button type="button" onClick={toggle} aria-label={playing ? `Pause ${track.title}` : `Play ${track.title}`} className={btn}>
        {playing ? <Pause className="size-[15px]" fill="currentColor" /> : <Play className="size-[15px]" fill="currentColor" />}
      </button>

      {/* The title needs room, so it appears only on wide screens. */}
      <div className="hidden min-w-0 items-center gap-2 px-1 xl:flex" title={track.title}>
        <Equalizer playing={playing && !muted} />
        <span className="max-w-[7.5rem] truncate font-display text-[0.62rem] uppercase tracking-[0.14em] text-bone-dim">{track.title}</span>
      </div>

      {count > 1 && (
        <button type="button" onClick={next} aria-label="Next track" className={btn}>
          <SkipForward className="size-[15px]" />
        </button>
      )}

      <button type="button" onClick={() => update({ muted: !muted })} aria-label={muted ? "Unmute music" : "Mute music"} aria-pressed={muted} className={btn}>
        {muted ? <VolumeX className="size-[15px] text-crimson-bright" /> : <Volume2 className="size-[15px]" />}
      </button>
    </div>
  );
}

function Equalizer({ playing }: { playing: boolean }) {
  return (
    <span aria-hidden className="flex h-3 items-end gap-[2px]">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={`h-full w-[2px] bg-crimson-bright ${playing ? "eq-bar" : ""}`}
          style={playing ? { animationDelay: `${i * 0.18}s` } : { transform: "scaleY(0.3)", transformOrigin: "bottom" }}
        />
      ))}
    </span>
  );
}
