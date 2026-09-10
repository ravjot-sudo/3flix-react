import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { MotionConfig } from "framer-motion";

import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ToastProvider } from "./context/ToastProvider.jsx";

import "./styles/base.css";
import "./styles/landing.css";
import "./styles/app.css";
import "./styles/scrollcraft.css";
import "./styles/booth.css";

/**
 * Entry point.
 *
 * Provider order matters: the Router must wrap anything that navigates, and
 * AuthProvider sits inside it because ProtectedRoute uses both.
 *
 * MotionConfig reducedMotion="user": when the OS asks for reduced motion,
 * framer-motion drops transform and layout animation everywhere and keeps
 * opacity and colour — fewer, gentler animations rather than none.
 *
 * StrictMode intentionally double-invokes effects in development to surface
 * missing cleanup. Every effect in this project is written to survive that.
 */
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <MotionConfig reducedMotion="user">
        <AuthProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </AuthProvider>
      </MotionConfig>
    </BrowserRouter>
  </StrictMode>,
);
