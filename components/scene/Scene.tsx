/* eslint-disable @next/next/no-img-element --
   These are deliberately plain <img>: scripts/art/build.mjs already emits each figure and
   setting at several widths as static WebP, so routing them through next/image would only add
   a resize at request time. srcset below picks the right one. */
import { Emblem } from "@/components/ui/Emblem";
import type { Character } from "@/data/types";
import { srcSet, type Art } from "@/lib/art";

/**
 * A character in their world: the setting fills the frame, the transparent
 * render stands in it. The figure is positioned by its head (`figureClass`
 * sets left/top/height; the head centre lands on `left`), so it is never
 * squashed, stretched or cropped through the face.
 *
 * Both images are pre-sized files chosen through srcset, so they arrive without
 * any resizing at request time; `priority` marks the one the page opens on.
 */
export function Scene({
  character: c,
  art,
  figureClass,
  sceneClass = "",
  sceneFit = "cover",
  scenePosition = "50% 50%",
  sceneSizes = "100vw",
  figureSizes = "45vw",
  animate,
  priority,
}: {
  character: Character;
  art: Art;
  figureClass: string;
  /** Extra classes for the setting layer, e.g. to start it partway across the frame. */
  sceneClass?: string;
  /**
   * "width" (desktop only): the whole setting is shown edge to edge, its top at
   * var(--scene-top), over a blurred copy that fills the rest of the frame.
   */
  sceneFit?: "cover" | "width";
  scenePosition?: string;
  sceneSizes?: string;
  figureSizes?: string;
  animate?: boolean;
  priority?: boolean;
}) {
  const r = art.render;
  const s = art.scene;
  const p = c.palette ?? { accent: "#a4824f", sky: "#2a2520", ground: "#11100e" };
  const frame = c.framing?.scene;
  const load = priority ? ({ fetchPriority: "high" as const, loading: "eager" as const }) : { loading: "eager" as const };

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className={`absolute inset-0 ${sceneClass} ${animate ? "scene-in" : ""}`}>
        {s ? (
          <>
            <div className="absolute inset-0" style={frame ? { transform: `scale(${frame.zoom})`, transformOrigin: frame.origin } : undefined}>
              <img
                src={s.src}
                srcSet={srcSet(s)}
                sizes={sceneSizes}
                alt=""
                decoding="async"
                {...load}
                // In width mode this becomes the blurred backdrop on desktop.
                className={`absolute inset-0 h-full w-full object-cover ${sceneFit === "width" ? "lg:scale-110 lg:opacity-45 lg:blur-2xl" : ""}`}
                style={{ objectPosition: scenePosition }}
              />
            </div>
            {sceneFit === "width" && (
              <div
                className="absolute inset-x-0 top-[var(--scene-top,7%)] hidden lg:block"
                style={{
                  aspectRatio: `${s.w} / ${s.h}`,
                  maskImage: "linear-gradient(180deg, transparent 0%, #000 14%, #000 84%, transparent 100%)",
                  WebkitMaskImage: "linear-gradient(180deg, transparent 0%, #000 14%, #000 84%, transparent 100%)",
                }}
              >
                <img src={s.src} srcSet={srcSet(s)} sizes={sceneSizes} alt="" decoding="async" {...load} className="absolute inset-0 h-full w-full object-cover" />
              </div>
            )}
          </>
        ) : (
          <div className="grain absolute inset-0" style={{ background: `radial-gradient(80% 70% at 60% 30%, ${p.sky}, ${p.ground} 75%)` }}>
            <Emblem kind={c.dossier?.emblem ?? c.faction} className="absolute left-1/2 top-[40%] size-[min(30rem,60%)] -translate-x-1/2 -translate-y-1/2 opacity-[0.07]" />
          </div>
        )}
      </div>
      {r && (
        <div className={`absolute ${figureClass}`} style={{ aspectRatio: `${r.w} / ${r.h}`, transform: `translateX(-${r.headX * 100}%)` }}>
          <div className={`relative h-full w-full ${animate ? "figure-in" : ""}`}>
            <img
              src={r.src}
              srcSet={srcSet(r)}
              sizes={figureSizes}
              alt={c.name}
              decoding="async"
              {...load}
              className="absolute inset-0 h-full w-full object-contain object-top drop-shadow-[0_20px_40px_rgb(0_0_0/0.55)]"
            />
          </div>
        </div>
      )}
    </div>
  );
}
