// Shared mutable state between the two synchronized canvases and the DOM clip layer.
// Updated once per frame by the "back" canvas; consumed by the front canvas and clip layer.
export const dragonState = {
  // Head screen position in CSS pixels (viewport-relative).
  headX: 0,
  headY: 0,
  // 0..1 — how much the head is "poking out" in front of cards right now.
  peek: 0,
  // seconds since mount
  t: 0,
  // pointer target (normalized -1..1)
  pointerX: 0,
  pointerY: 0,
};