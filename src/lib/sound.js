/**
 * Sound utilities — boot chime + loudness boost for quiet Archive rips.
 *
 * Everything here is crash-safe: no AudioContext on the server, resume on
 * user gesture (autoplay policy), and a compressor before the destination so
 * a boost never clips.
 */

let sharedCtx = null;
const boostNodes = new WeakMap();

function getContext() {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!sharedCtx) {
    try {
      sharedCtx = new AC();
    } catch {
      return null;
    }
  }
  return sharedCtx;
}

/**
 * Play a short two-note boot chime, boosted but clamped.
 * @param {{ boost?: number, when?: number }} [opts]
 * @returns {Promise<void>}
 */
export async function playBootSound({ boost = 1.8 } = {}) {
  try {
    const ctx = getContext();
    if (!ctx) return;
    // Autoplay policy: the context starts suspended until a gesture.
    if (ctx.state === "suspended") {
      try {
        await ctx.resume();
      } catch {
        return;
      }
      if (ctx.state !== "running") return;
    }

    const t0 = ctx.currentTime + 0.02;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.ratio.value = 6;
    comp.connect(ctx.destination);

    const master = ctx.createGain();
    // Boosted, but capped so 3x can't blow out laptop speakers.
    master.gain.value = Math.min(Math.max(boost, 0.5), 3);
    master.connect(comp);

    // C5 -> G5, 0.28s each, exponential decay = no clicks.
    const notes = [523.25, 783.99];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      const start = t0 + i * 0.16;
      osc.type = "sine";
      osc.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, start);
      g.gain.exponentialRampToValueAtTime(0.5, start + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, start + 0.32);
      osc.connect(g);
      g.connect(master);
      osc.start(start);
      osc.stop(start + 0.36);
    });
  } catch {
    /* sound is decorative — never crash the app for it */
  }
}

/**
 * Boost a <video> element beyond volume=1 via Web Audio.
 * Safe to call repeatedly; the graph is built once per element.
 * @param {HTMLMediaElement|null} el
 * @param {boolean} on
 * @param {number} [amount=2] linear gain when on
 * @returns {() => void} cleanup for this element (disconnects boost)
 */
export function setVideoBoost(el, on, amount = 2) {
  if (!el) return () => {};
  try {
    const ctx = getContext();
    // No Web Audio (or already routed elsewhere): fall back to full volume.
    if (!ctx || !(ctx.createMediaElementSource instanceof Function)) {
      el.volume = 1;
      return () => {};
    }
    let nodes = boostNodes.get(el);
    if (!nodes) {
      const src = ctx.createMediaElementSource(el);
      const gain = ctx.createGain();
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -18;
      comp.ratio.value = 8;
      gain.connect(comp);
      comp.connect(ctx.destination);
      // Keep the direct path disconnected once routed: source -> gain only,
      // otherwise the video plays twice (double volume + phasing).
      src.connect(gain);
      nodes = { gain };
      boostNodes.set(el, nodes);
    }
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    nodes.gain.gain.value = on ? Math.min(Math.max(amount, 1), 3) : 1;
    el.volume = 1;
  } catch {
    try {
      el.volume = 1;
    } catch {
      /* ignore */
    }
  }
  return () => {};
}
