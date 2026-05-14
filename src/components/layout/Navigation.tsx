import { NavLink } from "react-router-dom";

const navigationItems = [
  { label: "Dashboard", to: "/" },
  { label: "Users", to: "/users" },
  { label: "Pages", to: "/pages" },
] as const;

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
