import type { ReactNode } from "react";
import { usePreferences } from "../../preferences/PreferencesContext";
import Header from "./Header";
import Navigation from "./Navigation";

/**
 * Provides the shared application shell for authenticated CMS pages.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  const {
    buttonSize,
    contentWidth,
    density,
    fontSize,
    navigationBehavior,
    navigationLayout,
    reduceMotion,
    tableStripes,
  } = usePreferences();
  const className = [
    "app-layout",
    `app-layout--${navigationLayout}`,
    `app-layout--menu-${navigationBehavior}`,
    `app-layout--density-${density}`,
    `app-layout--content-${contentWidth}`,
    `app-layout--button-${buttonSize}`,
    `app-layout--font-${fontSize}`,
    tableStripes ? "app-layout--striped-tables" : "",
    reduceMotion ? "app-layout--reduce-motion" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={className}>
      <Header />
      <div className="app-layout__body">
        <Navigation />
        <main className="app-layout__content">{children}</main>
      </div>
    </div>
  );
}
