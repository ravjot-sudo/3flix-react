import { createContext } from "react";

/** Context object on its own module so Fast Refresh keeps working. */
export const ToastContext = createContext(null);
