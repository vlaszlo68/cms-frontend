import { NavLink } from "react-router";
import { useAuth } from "../../auth/AuthContext";
import type { TranslationKey } from "../../i18n/translations";
import { usePreferences } from "../../preferences/PreferencesContext";

/**
 * Main navigation entries displayed in the authenticated app shell.
 */
const navigationItems = [
  { labelKey: "dashboard", to: "/" },
  { labelKey: "users", to: "/users" },
  { labelKey: "pages", to: "/pages" },
  { labelKey: "settings", to: "/settings" },
] as const;

/**
 * Renders the CMS primary navigation and marks the active route.
 */
export default function Navigation() {
  const { user } = useAuth();
  const { t } = usePreferences();
  const visibleItems = navigationItems.filter(
    (item) => !["/users", "/pages"].includes(item.to) || user?.role === "ADMIN",
  );

  return (
    <nav aria-label="Main navigation" className="app-navigation">
      {visibleItems.map((item) => (
        <NavLink
          className={({ isActive }) =>
            isActive ? "app-navigation__link app-navigation__link--active" : "app-navigation__link"
          }
          end={item.to === "/"}
          key={item.to}
          to={item.to}
        >
          {t(item.labelKey as TranslationKey)}
        </NavLink>
      ))}
    </nav>
  );
}
