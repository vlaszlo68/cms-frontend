import type { ReactNode } from "react";
import Header from "./Header";
import Navigation from "./Navigation";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="app-layout">
      <Header />
      <div className="app-layout__body">
        <Navigation />
        <main className="app-layout__content">{children}</main>
      </div>
    </div>
  );
}
