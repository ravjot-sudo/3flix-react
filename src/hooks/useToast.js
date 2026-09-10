import { useContext } from "react";
import { ToastContext } from "../context/toastContext.js";

/** CUSTOM HOOK — raise a toast from anywhere below <ToastProvider>. */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
