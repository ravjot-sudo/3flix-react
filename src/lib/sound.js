/**
 * Sound utilities — boot chime + loudness boost for quiet Archive rips.
 *
 * Everything here is crash-safe: no AudioContext on the server, resume on
 * user gesture (autoplay policy), and a compressor before the destination so
 * a boost never clips. Boosts asked for before unlock are deferred, never
 * routed into a suspended context (which would silence the video).
 */

let sharedCtx = null;
const boostNodes = new WeakMap();
// Boosts asked for while audio is still locked (before any user gesture).
// Applied the moment the context runs — see armUnlock.
const pendingBoost = new Map();
let unlockArmed = false;
// Max linear gain for the watch-settings boost: 9x = 300% of the old 3x
// ceiling. A compressor after the gain keeps it from clipping.
const MAX_BOOST = 9;

/**
 * True when `src` points at another origin (e.g. an Archive.org file).
 * Browsers zero the audio of a cross-origin <video> served without CORS
 * headers once it is routed into Web Audio — permanent silence for that
 * element. Such streams must never be routed; they play at full volume.
 */
export function isExternalVideo(src) {
  try {
    if (!src || src.startsWith("blob:") || src.startsWith("data:")) return false;
    if (typeof window === "undefined" || !window.location) return false;
    return new URL(src, window.location.href).origin !== window.location.origin;
  } catch {
    return false;
  }
}

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

/** Apply every deferred boost, now that the context is running. */
function flushPendingBoosts() {
  try {
    const ctx = getContext();
    if (!ctx || ctx.state !== "running") return;
    for (const [el, req] of pendingBoost) {
      pendingBoost.delete(el);
      applyBoost(el, req.on, req.amount);
    }
  } catch {
    /* never crash the app for sound */
  }
}

/** One-time gesture listeners: unlock audio, then apply deferred boosts. */
function armUnlock() {
  if (unlockArmed || typeof window === "undefined") return;
  unlockArmed = true;
  const onGesture = () => {
    const ctx = getContext();
    if (ctx && ctx.state === "suspended") {
      try {
        ctx.resume().catch(() => {});
      } catch {
        /* still locked — listeners stay armed */
      }
    }
    // resume() resolves async; re-check shortly after the gesture.
    setTimeout(() => {
      const c = getContext();
      if (c && c.state === "running") {
        unlockArmed = false;
        window.removeEventListener("pointerdown", onGesture);
        window.removeEventListener("keydown", onGesture);
        flushPendingBoosts();
      }
    }, 150);
  };
  window.addEventListener("pointerdown", onGesture);
  window.addEventListener("keydown", onGesture);
}

/** Route `el` through gain (once) and set its level. Context must be running. */
function applyBoost(el, on, amount) {
  const ctx = getContext();
  if (!ctx || typeof ctx.createMediaElementSource !== "function") {
    el.volume = 1;
    return;
  }
  // Defensive: never build a graph for an external stream (see setVideoBoost).
  if (isExternalVideo(el.currentSrc || el.src)) {
    el.volume = 1;
    return;
  }
  let nodes = boostNodes.get(el);
  if (!nodes) {
    // Boost off for a never-routed element: nothing to build, normal volume.
    if (!on) {
      el.volume = 1;
      return;
    }
    const src = ctx.createMediaElementSource(el);
    const gain = ctx.createGain();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -24;
    comp.ratio.value = 12;
    gain.connect(comp);
    comp.connect(ctx.destination);
    // Keep the direct path disconnected once routed: source -> gain only,
    // otherwise the video plays twice (double volume + phasing).
    src.connect(gain);
    nodes = { gain };
    boostNodes.set(el, nodes);
  }
  nodes.gain.gain.value = on ? Math.min(Math.max(amount, 1), MAX_BOOST) : 1;
  el.volume = 1;
}

/**
 * Boost a <video> element beyond volume=1 via Web Audio.
 * Safe to call repeatedly; the graph is built once per element.
 *
 * Silence guard: routing an element while the context is still suspended
 * (page load with a persisted boost, before any click/keypress) would mute
 * it, and routing is permanent for the element. So before the first gesture
 * the request is deferred — normal volume until then, boost right after.
 *
 * CORS guard: a cross-origin stream without CORS headers (all Archive.org
 * files) would come out of Web Audio as pure silence once routed, and
 * routing is permanent — so such elements are never routed and always play
 * at full volume instead.
 *
 * @param {HTMLMediaElement|null} el
 * @param {boolean} on
 * @param {number} [amount=2] linear gain when on (clamped to MAX_BOOST)
 */
export function setVideoBoost(el, on, amount = 2) {
  if (!el) return;
  try {
    // External stream: never route, never defer — full volume, always sound.
    if (isExternalVideo(el.currentSrc || el.src)) {
      pendingBoost.delete(el);
      el.volume = 1;
      return;
    }
    const ctx = getContext();
    // No Web Audio: fall back to full volume.
    if (!ctx || typeof ctx.createMediaElementSource !== "function") {
      pendingBoost.delete(el);
      el.volume = 1;
      return;
    }
    if (ctx.state !== "running") {
      pendingBoost.set(el, { on, amount });
      try {
        ctx.resume().catch(() => {});
      } catch {
        /* locked until a gesture — listeners below cover it */
      }
      armUnlock();
      el.volume = 1;
      // resume() may already have succeeded (gesture context): retry soon.
      setTimeout(flushPendingBoosts, 200);
      return;
    }
    pendingBoost.set(el, { on, amount });
    flushPendingBoosts();
  } catch {
    try {
      pendingBoost.delete(el);
      el.volume = 1;
    } catch {
      /* ignore */
    }
  }
}
