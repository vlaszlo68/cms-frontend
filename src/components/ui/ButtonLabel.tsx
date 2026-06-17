import type { ReactNode } from "react";
import { usePreferences } from "../../preferences/PreferencesContext";

type ButtonIcon =
  | "back"
  | "cancel"
  | "create"
  | "deactivate"
  | "delete"
  | "edit"
  | "logout"
  | "preview"
  | "refresh"
  | "save";

const icons: Record<ButtonIcon, string> = {
  back: "\u25c0",
  cancel: "\u00d7",
  create: "+",
  deactivate: "!",
  delete: "\u00d7",
  edit: "\u270e",
  logout: "\u25b6",
  preview: "\u25c9",
  refresh: "\u27f3",
  save: "\u2713",
};

export default function ButtonLabel({
  children,
  icon,
}: {
  children: ReactNode;
  icon: ButtonIcon;
}) {
  const { showButtonIcons } = usePreferences();

  return (
    <span className="button-label">
      {showButtonIcons && (
        <span aria-hidden="true" className="button-icon">
          {icons[icon]}
        </span>
      )}
      <span>{children}</span>
    </span>
  );
}
