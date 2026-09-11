import { useId } from "react";
import { Navigate, useLocation } from "react-router-dom";
import GateWall from "../components/GateWall.jsx";
import SignInCard from "../components/SignInCard.jsx";
import { useAuth } from "../hooks/useAuth.js";

/**
 * /signin — the gate as a page, for anyone who arrives somewhere other than
 * the home page while signed out (a shared link, a bookmark). The home page
 * shows the same card as a pop-up once the opening ends (SignInGate).
 *
 * ProtectedRoute stashed where the visitor was heading in location.state;
 * once signed in, this renders a <Navigate> straight back there.
 */
export default function SignIn() {
  const { ready, isSignedIn } = useAuth();
  const location = useLocation();
  const titleId = useId();
  const from = location.state?.from ?? "/";

  if (ready && isSignedIn) return <Navigate to={from} replace />;

  return (
    <main className="gate gate-page" aria-labelledby={titleId}>
      <GateWall />
      <div className="gate-pop">
        {ready ? <SignInCard titleId={titleId} as="h1" focusOnMount /> : <p className="label">Checking your session…</p>}
      </div>
    </main>
  );
}
