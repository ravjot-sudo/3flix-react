import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";

/**
 * PROTECTED ROUTE — a wrapper component that redirects when signed out.
 *
 * Demonstrates: conditional rendering as routing, <Navigate> for a
 * declarative redirect, useLocation to remember where the user was headed,
 * and `replace` so the guarded page does not pile up in browser history.
 */
export default function ProtectedRoute({ children }) {
  const { isSignedIn } = useAuth();
  const location = useLocation();

  if (!isSignedIn) {
    return <Navigate to="/signin" state={{ from: location.pathname }} replace />;
  }
  return children;
}
