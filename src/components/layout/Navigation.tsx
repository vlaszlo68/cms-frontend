import { NavLink } from "react-router-dom";

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
  return (
    <nav aria-label="Main navigation" className="app-navigation">
      {navigationItems.map((item) => (
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
