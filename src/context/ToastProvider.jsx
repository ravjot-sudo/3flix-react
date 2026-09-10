import { useCallback, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ToastContext } from "./toastContext.js";

/**
 * TOAST — one message at a time, polite, never takes focus.
 *
 * role="status" rather than role="alert": a confirmation is not an emergency,
 * and alert would interrupt whatever a screen reader was already saying.
 */
export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const timer = useRef(0);

  const show = useCallback((message, { undo } = {}) => {
    clearTimeout(timer.current);
    setToast({ id: Date.now(), message, undo });
    timer.current = setTimeout(() => setToast(null), 4600);
  }, []);

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-slot" role="status" aria-live="polite">
        <AnimatePresence>
          {toast && (
            <motion.div
              key={toast.id}
              className="toast"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } }}
              exit={{ opacity: 0, y: 8, transition: { duration: 0.26 } }}
            >
              <span>{toast.message}</span>
              {toast.undo && (
                <button
                  type="button"
                  className="toast-undo"
                  onClick={() => { toast.undo(); setToast(null); }}
                >
                  Undo
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
