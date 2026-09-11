import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";

/**
 * PROTECTED ROUTE — a layout route that lets its children render only for a
 * signed-in visitor. It wraps every page except the home page's opening
 * (App.jsx), so it is the gate to the site.
 *
 * Demonstrates: conditional rendering as routing, <Navigate> for a
 * declarative redirect, useLocation to remember where the user was headed,
 * and `replace` so the guarded page does not pile up in browser history.
 * While a stored session is still being restored it waits, rather than
 * bouncing a signed-in visitor to the sign-in page for a frame.
 */
export default function ProtectedRoute() {
  const { ready, isSignedIn } = useAuth();
  const location = useLocation();

  if (!ready) {
    return <div className="boot"><p className="label">Checking your session…</p></div>;
  }
  if (!isSignedIn) {
    return <Navigate to="/signin" state={{ from: location.pathname + location.search }} replace />;
  }
  return <Outlet />;
}
