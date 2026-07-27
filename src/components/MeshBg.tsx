/**
 * MeshBg — VisionOS-inspired animated background.
 *
 * Flowing light waves (NOT solid blobs), volumetric aurora layers,
 * and subtle cyan/aqua/sky-blue gradients drifting slowly.
 *
 * redesign.txt spec:
 * - Soft white base (#F7F9FC)
 * - Large animated mesh gradients in light cyan, sky blue, aqua, light gray
 * - Blurry flowing light waves, not solid blobs
 * - Subtle volumetric light and aurora effects
 * - 30–60 second loop, never distracting
 */
export function MeshBg() {
  return (
    <div className="mesh-bg" aria-hidden="true">
      {/* Aurora layer — top region volumetric light */}
      <div className="mesh-aurora animate-aurora" style={{ top: "-5%" }} />

      {/* Aurora layer — bottom region */}
      <div
        className="mesh-aurora animate-aurora"
        style={{
          top: "55%",
          background:
            "linear-gradient(0deg, rgba(186,230,253,0.08) 0%, rgba(103,232,249,0.04) 30%, transparent 70%)",
          animationDelay: "-9s",
        }}
      />

      {/* Wave 1 — large aqua flow, top-left */}
      <div
        className="mesh-wave animate-wave-1"
        style={{
          width: "900px",
          height: "700px",
          top: "-12%",
          left: "-8%",
          background:
            "radial-gradient(ellipse at 40% 35%, rgba(125,211,252,0.30) 0%, rgba(125,211,252,0.08) 45%, transparent 70%)",
        }}
      />

      {/* Wave 2 — cyan flow, top-right */}
      <div
        className="mesh-wave animate-wave-2"
        style={{
          width: "750px",
          height: "650px",
          top: "-5%",
          right: "-10%",
          borderRadius: "50% 45% 60% 40% / 55% 40% 50% 45%",
          background:
            "radial-gradient(ellipse at 55% 30%, rgba(103,232,249,0.28) 0%, rgba(103,232,249,0.06) 45%, transparent 70%)",
        }}
      />

      {/* Wave 3 — sky-blue flow, bottom-left */}
      <div
        className="mesh-wave animate-wave-3"
        style={{
          width: "800px",
          height: "750px",
          bottom: "-12%",
          left: "5%",
          borderRadius: "45% 55% 40% 60% / 55% 45% 60% 40%",
          background:
            "radial-gradient(ellipse at 35% 60%, rgba(186,230,253,0.30) 0%, rgba(186,230,253,0.07) 48%, transparent 72%)",
        }}
      />

      {/* Wave 4 — subtle light-gray aqua, center-right */}
      <div
        className="mesh-wave animate-wave-4"
        style={{
          width: "600px",
          height: "550px",
          top: "30%",
          right: "5%",
          borderRadius: "55% 45% 50% 55% / 45% 55% 45% 50%",
          background:
            "radial-gradient(ellipse at 50% 50%, rgba(56,189,248,0.18) 0%, rgba(200,220,240,0.05) 45%, transparent 70%)",
        }}
      />

      {/* Subtle center glow — volumetric light */}
      <div
        className="mesh-wave"
        style={{
          width: "500px",
          height: "400px",
          top: "20%",
          left: "50%",
          transform: "translateX(-50%)",
          borderRadius: "50%",
          filter: "blur(140px)",
          opacity: 0.18,
          background:
            "radial-gradient(circle, rgba(255,255,255,0.50) 0%, rgba(200,230,255,0.15) 40%, transparent 70%)",
          animation: "aurora-pulse 22s ease-in-out infinite alternate",
        }}
      />
    </div>
  );
}
