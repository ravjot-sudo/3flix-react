import { useCallback } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage.js";
import { playBootSound } from "../lib/sound.js";

/**
 * SOUND TOGGLE — persisted mute for the boot chime.
 * Sits in the nav bar; "M" unmutes with a preview so you hear the boost.
 */
export default function SoundToggle() {
  const [enabled, setEnabled] = useLocalStorage("3flix:sound", true);

  const toggle = useCallback(() => {
    setEnabled((on) => {
      if (!on) playBootSound().catch(() => {});
      return !on;
    });
  }, [setEnabled]);

  return (
    <button
      type="button"
      className="btn-icon sound-btn"
      onClick={toggle}
      aria-pressed={enabled}
      aria-label={enabled ? "Mute boot sound" : "Unmute boot sound"}
      title={enabled ? "Boot sound on" : "Boot sound off"}
    >
      <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path
          d="M2 6v4h2.5L8 13V3L4.5 6H2z"
          fill="currentColor"
        />
        {enabled ? (
          <path
            d="M10 5.5a3.5 3.5 0 010 5M11.8 3.8a6 6 0 010 8.4"
            stroke="currentColor"
            strokeLinecap="round"
          />
        ) : (
          <path d="M10 6l4 4M14 6l-4 4" stroke="currentColor" strokeLinecap="round" />
        )}
      </svg>
    </button>
  );
}
