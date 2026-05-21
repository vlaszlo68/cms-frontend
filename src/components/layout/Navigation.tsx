import { NavLink } from "react-router";
import { useAuth } from "../../auth/AuthContext";

/**
 * Main navigation entries displayed in the authenticated app shell.
 */
const navigationItems = [
  { label: "Dashboard", to: "/" },
  { label: "Users", to: "/users" },
  { label: "Pages", to: "/pages" },
] as const;

/**
 * Renders the CMS primary navigation and marks the active route.
 */
export default function Navigation() {
  const { user } = useAuth();
  const visibleItems = navigationItems.filter((item) => item.to !== "/users" || user?.role === "ADMIN");

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
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
