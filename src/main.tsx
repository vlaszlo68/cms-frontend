import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import App from "./App";
import { AuthProvider } from "./auth/AuthContext";
import { PreferencesProvider } from "./preferences/PreferencesContext";
import { SiteProvider } from "./sites/SiteContext";
import "./styles.css";

/**
 * Mounts the React application and wires global providers used by every route.
 */
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <PreferencesProvider>
        <AuthProvider>
          <SiteProvider><App /></SiteProvider>
        </AuthProvider>
      </PreferencesProvider>
    </BrowserRouter>
  </StrictMode>,
);
