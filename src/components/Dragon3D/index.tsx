import { Canvas } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import DragonScene from "./DragonScene";
import { dragonState } from "./dragonState";

/**
 * Cinematic 3D dragon that appears to weave between the page's cards.
 *
 * Two synchronized full-viewport canvases render the same scene at different
 * z-index layers:
 *   - back canvas (z:0)  → dragon body behind all cards
 *   - front canvas (z:45) → dragon parts that "poke through" cards, revealed
 *     only inside a moving clip-path circle around the head. The clip radius
 *     is driven by the shared `peek` value updated by the back canvas.
 *
 * Because both canvases run the exact same procedural animation and share a
 * time source, they stay pixel-locked, producing the illusion that a single
 * dragon threads in and out of the cards.
 */
export default function Dragon3D() {
  const frontRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      dragonState.pointerX = (e.clientX / window.innerWidth) * 2 - 1;
      dragonState.pointerY = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    const tick = () => {
      const el = frontRef.current;
      if (el) {
        const r = 60 + dragonState.peek * 160; // px
        const x = dragonState.headX;
        const y = dragonState.headY;
        // Only show the front canvas within a soft circle around the head.
        // clipPath removes everything outside → back canvas is what shows behind cards.
        el.style.clipPath = `circle(${r}px at ${x}px ${y}px)`;
        el.style.opacity = dragonState.peek > 0.02 ? "1" : "0";
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  const canvasStyle: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    width: "100%",
    height: "100%",
    pointerEvents: "none",
  };

  return (
    <>
      {/* Behind cards */}
      <div style={{ ...canvasStyle, zIndex: 0 }} aria-hidden>
        <Canvas
          camera={{ position: [0, 0, 10], fov: 45 }}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          dpr={[1, 1.75]}
        >
          <DragonScene updateShared />
        </Canvas>
      </div>

      {/* In front of cards, revealed only around the head via clip-path */}
      <div
        ref={frontRef}
        style={{
          ...canvasStyle,
          zIndex: 45,
          transition: "opacity 220ms ease-out",
          opacity: 0,
          clipPath: "circle(0px at 0px 0px)",
        }}
        aria-hidden
      >
        <Canvas
          camera={{ position: [0, 0, 10], fov: 45 }}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          dpr={[1, 1.75]}
        >
          <DragonScene />
        </Canvas>
      </div>
    </>
  );
}