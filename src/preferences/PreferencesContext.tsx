import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Language, TranslationKey } from "../i18n/translations";
import { translations } from "../i18n/translations";

export type ThemeName =
  | "classic"
  | "forest"
  | "wine"
  | "graphite"
  | "lagoon"
  | "sunrise"
  | "dusk"
  | "harbor"
  | "ember"
  | "midnight"
  | "aurora";
export type NavigationLayout = "sidebar" | "horizontal";
export type NavigationBehavior = "fixed" | "floating" | "peek";
export type DisplayDensity = "compact" | "normal" | "comfortable";
export type DateFormat = "short" | "long";
export type ContentWidth = "full" | "centered";
export type ButtonSize = "normal" | "compact";
export type FontSize = "normal" | "compact";

type PreferencesContextValue = {
  theme: ThemeName;
  navigationLayout: NavigationLayout;
  navigationBehavior: NavigationBehavior;
  density: DisplayDensity;
  dateFormat: DateFormat;
  contentWidth: ContentWidth;
  buttonSize: ButtonSize;
  fontSize: FontSize;
  language: Language;
  showDate: boolean;
  showTime: boolean;
  tableStripes: boolean;
  reduceMotion: boolean;
  showButtonIcons: boolean;
  setTheme: (theme: ThemeName) => void;
  setNavigationLayout: (layout: NavigationLayout) => void;
  setNavigationBehavior: (behavior: NavigationBehavior) => void;
  setDensity: (density: DisplayDensity) => void;
  setDateFormat: (dateFormat: DateFormat) => void;
  setContentWidth: (contentWidth: ContentWidth) => void;
  setButtonSize: (buttonSize: ButtonSize) => void;
  setFontSize: (fontSize: FontSize) => void;
  setLanguage: (language: Language) => void;
  setShowDate: (showDate: boolean) => void;
  setShowTime: (showTime: boolean) => void;
  setTableStripes: (tableStripes: boolean) => void;
  setReduceMotion: (reduceMotion: boolean) => void;
  setShowButtonIcons: (showButtonIcons: boolean) => void;
  t: (key: TranslationKey) => string;
};

const PreferencesContext = createContext<PreferencesContextValue | undefined>(undefined);

const themeStorageKey = "cms.theme";
const navigationLayoutStorageKey = "cms.navigationLayout";
const navigationBehaviorStorageKey = "cms.navigationBehavior";
const densityStorageKey = "cms.density";
const dateFormatStorageKey = "cms.dateFormat";
const contentWidthStorageKey = "cms.contentWidth";
const buttonSizeStorageKey = "cms.buttonSize";
const fontSizeStorageKey = "cms.fontSize";
const languageStorageKey = "cms.language";
const showDateStorageKey = "cms.showDate";
const showTimeStorageKey = "cms.showTime";
const tableStripesStorageKey = "cms.tableStripes";
const reduceMotionStorageKey = "cms.reduceMotion";
const showButtonIconsStorageKey = "cms.showButtonIcons";
const themes: ThemeName[] = [
  "classic",
  "forest",
  "wine",
  "graphite",
  "lagoon",
  "sunrise",
  "dusk",
  "harbor",
  "ember",
  "midnight",
  "aurora",
];
const navigationLayouts: NavigationLayout[] = ["sidebar", "horizontal"];
const navigationBehaviors: NavigationBehavior[] = ["fixed", "floating", "peek"];
const densities: DisplayDensity[] = ["compact", "normal", "comfortable"];
const dateFormats: DateFormat[] = ["short", "long"];
const contentWidths: ContentWidth[] = ["full", "centered"];
const buttonSizes: ButtonSize[] = ["normal", "compact"];
const fontSizes: FontSize[] = ["normal", "compact"];
const languages: Language[] = ["en", "hu"];

function readStoredValue<T extends string>(key: string, allowedValues: readonly T[], fallback: T) {
  const storedValue = window.localStorage.getItem(key);
  return allowedValues.includes(storedValue as T) ? (storedValue as T) : fallback;
}

function readStoredBoolean(key: string, fallback: boolean) {
  const storedValue = window.localStorage.getItem(key);

  if (storedValue === "true") {
    return true;
  }

  if (storedValue === "false") {
    return false;
  }

  return fallback;
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeName>(() =>
    readStoredValue(themeStorageKey, themes, "classic"),
  );
  const [navigationLayout, setNavigationLayout] = useState<NavigationLayout>(() =>
    readStoredValue(navigationLayoutStorageKey, navigationLayouts, "sidebar"),
  );
  const [navigationBehavior, setNavigationBehavior] = useState<NavigationBehavior>(() =>
    readStoredValue(navigationBehaviorStorageKey, navigationBehaviors, "fixed"),
  );
  const [density, setDensity] = useState<DisplayDensity>(() =>
    readStoredValue(densityStorageKey, densities, "normal"),
  );
  const [dateFormat, setDateFormat] = useState<DateFormat>(() =>
    readStoredValue(dateFormatStorageKey, dateFormats, "short"),
  );
  const [contentWidth, setContentWidth] = useState<ContentWidth>(() =>
    readStoredValue(contentWidthStorageKey, contentWidths, "full"),
  );
  const [buttonSize, setButtonSize] = useState<ButtonSize>(() =>
    readStoredValue(buttonSizeStorageKey, buttonSizes, "normal"),
  );
  const [fontSize, setFontSize] = useState<FontSize>(() =>
    readStoredValue(fontSizeStorageKey, fontSizes, "normal"),
  );
  const [language, setLanguage] = useState<Language>(() =>
    readStoredValue(languageStorageKey, languages, "en"),
  );
  const [showDate, setShowDate] = useState(() => readStoredBoolean(showDateStorageKey, true));
  const [showTime, setShowTime] = useState(() => readStoredBoolean(showTimeStorageKey, true));
  const [tableStripes, setTableStripes] = useState(() =>
    readStoredBoolean(tableStripesStorageKey, false),
  );
  const [reduceMotion, setReduceMotion] = useState(() =>
    readStoredBoolean(reduceMotionStorageKey, false),
  );
  const [showButtonIcons, setShowButtonIcons] = useState(() =>
    readStoredBoolean(showButtonIconsStorageKey, true),
  );

  useEffect(() => {
    window.localStorage.setItem(themeStorageKey, theme);
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    window.localStorage.setItem(navigationLayoutStorageKey, navigationLayout);
  }, [navigationLayout]);

  useEffect(() => {
    window.localStorage.setItem(navigationBehaviorStorageKey, navigationBehavior);
  }, [navigationBehavior]);

  useEffect(() => {
    window.localStorage.setItem(densityStorageKey, density);
  }, [density]);

  useEffect(() => {
    window.localStorage.setItem(dateFormatStorageKey, dateFormat);
  }, [dateFormat]);

  useEffect(() => {
    window.localStorage.setItem(contentWidthStorageKey, contentWidth);
  }, [contentWidth]);

  useEffect(() => {
    window.localStorage.setItem(buttonSizeStorageKey, buttonSize);
  }, [buttonSize]);

  useEffect(() => {
    window.localStorage.setItem(fontSizeStorageKey, fontSize);
  }, [fontSize]);

  useEffect(() => {
    window.localStorage.setItem(languageStorageKey, language);
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    window.localStorage.setItem(showDateStorageKey, String(showDate));
  }, [showDate]);

  useEffect(() => {
    window.localStorage.setItem(showTimeStorageKey, String(showTime));
  }, [showTime]);

  useEffect(() => {
    window.localStorage.setItem(tableStripesStorageKey, String(tableStripes));
  }, [tableStripes]);

  useEffect(() => {
    window.localStorage.setItem(reduceMotionStorageKey, String(reduceMotion));
  }, [reduceMotion]);

  useEffect(() => {
    window.localStorage.setItem(showButtonIconsStorageKey, String(showButtonIcons));
  }, [showButtonIcons]);

  const value = useMemo<PreferencesContextValue>(
    () => ({
      theme,
      navigationLayout,
      navigationBehavior,
      density,
      dateFormat,
      contentWidth,
      buttonSize,
      fontSize,
      language,
      showDate,
      showTime,
      tableStripes,
      reduceMotion,
      showButtonIcons,
      setTheme,
      setNavigationLayout,
      setNavigationBehavior,
      setDensity,
      setDateFormat,
      setContentWidth,
      setButtonSize,
      setFontSize,
      setLanguage,
      setShowDate,
      setShowTime,
      setTableStripes,
      setReduceMotion,
      setShowButtonIcons,
      t: (key) => translations[language][key],
    }),
    [
      contentWidth,
      buttonSize,
      dateFormat,
      density,
      fontSize,
      language,
      navigationBehavior,
      navigationLayout,
      reduceMotion,
      showButtonIcons,
      showDate,
      showTime,
      tableStripes,
      theme,
    ],
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const context = useContext(PreferencesContext);

  if (!context) {
    throw new Error("usePreferences must be used within a PreferencesProvider.");
  }

  return context;
}
