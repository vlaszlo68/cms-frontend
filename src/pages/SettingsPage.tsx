import type { Language, TranslationKey } from "../i18n/translations";
import type {
  ButtonSize,
  ContentWidth,
  DateFormat,
  DesignName,
  DisplayDensity,
  FontSize,
  NavigationBehavior,
  NavigationLayout,
  TablePageSize,
  ThemeName,
} from "../preferences/PreferencesContext";
import { usePreferences } from "../preferences/PreferencesContext";

const themeOptions: Array<{ labelKey: TranslationKey; value: ThemeName }> = [
  { labelKey: "classicTheme", value: "classic" },
  { labelKey: "forestTheme", value: "forest" },
  { labelKey: "wineTheme", value: "wine" },
  { labelKey: "graphTheme", value: "graphite" },
  { labelKey: "lagoonTheme", value: "lagoon" },
  { labelKey: "sunriseTheme", value: "sunrise" },
  { labelKey: "duskTheme", value: "dusk" },
  { labelKey: "harborTheme", value: "harbor" },
  { labelKey: "emberTheme", value: "ember" },
  { labelKey: "cinderTheme", value: "cinder" },
  { labelKey: "midnightTheme", value: "midnight" },
  { labelKey: "auroraTheme", value: "aurora" },
];

const designOptions: Array<{ labelKey: TranslationKey; value: DesignName }> = [
  { labelKey: "originalDesign", value: "original" },
  { labelKey: "braveDesign", value: "brave" },
  { labelKey: "dossierDesign", value: "dossier" },
  { labelKey: "blueprintDesign", value: "blueprint" },
];

const navigationLayoutOptions: Array<{ labelKey: TranslationKey; value: NavigationLayout }> = [
  { labelKey: "sidebarMenu", value: "sidebar" },
  { labelKey: "horizontalMenu", value: "horizontal" },
];

const navigationBehaviorOptions: Array<{ labelKey: TranslationKey; value: NavigationBehavior }> = [
  { labelKey: "fixedMenuBehavior", value: "fixed" },
  { labelKey: "floatingMenuBehavior", value: "floating" },
  { labelKey: "peekMenuBehavior", value: "peek" },
];

const densityOptions: Array<{ labelKey: TranslationKey; value: DisplayDensity }> = [
  { labelKey: "compactDensity", value: "compact" },
  { labelKey: "normalDensity", value: "normal" },
  { labelKey: "comfortableDensity", value: "comfortable" },
];

const dateFormatOptions: Array<{ labelKey: TranslationKey; value: DateFormat }> = [
  { labelKey: "shortDateFormat", value: "short" },
  { labelKey: "longDateFormat", value: "long" },
];

const contentWidthOptions: Array<{ labelKey: TranslationKey; value: ContentWidth }> = [
  { labelKey: "fullContentWidth", value: "full" },
  { labelKey: "centeredContentWidth", value: "centered" },
];

const buttonSizeOptions: Array<{ labelKey: TranslationKey; value: ButtonSize }> = [
  { labelKey: "normalButtonSize", value: "normal" },
  { labelKey: "compactButtonSize", value: "compact" },
];

const fontSizeOptions: Array<{ labelKey: TranslationKey; value: FontSize }> = [
  { labelKey: "normalFontSize", value: "normal" },
  { labelKey: "compactFontSize", value: "compact" },
];

const tablePageSizeOptions: TablePageSize[] = [10, 20, 50, 100];

const languageOptions: Array<{ label: string; value: Language }> = [
  { label: "English", value: "en" },
  { label: "Magyar", value: "hu" },
];

export default function SettingsPage() {
  const {
    buttonSize,
    contentWidth,
    dateFormat,
    density,
    design,
    fontSize,
    language,
    navigationBehavior,
    navigationLayout,
    reduceMotion,
    setButtonSize,
    setContentWidth,
    setDateFormat,
    setDensity,
    setDesign,
    setFontSize,
    setLanguage,
    setNavigationBehavior,
    setNavigationLayout,
    setReduceMotion,
    setShowButtonIcons,
    setShowDate,
    setShowTime,
    setTableStripes,
    setTheme,
    showDate,
    showTime,
    showButtonIcons,
    tableStripes,
    tablePageSize,
    setTablePageSize,
    t,
    theme,
  } = usePreferences();

  return (
    <section className="settings-page">
      <div className="page-heading">
        <div>
          <h2>{t("settings")}</h2>
          <p>{t("settingsIntro")}</p>
        </div>
      </div>

      <form className="settings-form">
        <div className="settings-form__column">
          <label>
            {t("design")}
            <select
              onChange={(event) => setDesign(event.target.value as DesignName)}
              value={design}
            >
              {designOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {t(option.labelKey)}
                </option>
              ))}
            </select>
          </label>

          <label>
            {t("colorTheme")}
            <select
              onChange={(event) => setTheme(event.target.value as ThemeName)}
              value={theme}
            >
              {themeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {t(option.labelKey)}
                </option>
              ))}
            </select>
          </label>

          <label>
            {t("menu")}
            <select
              onChange={(event) => setNavigationLayout(event.target.value as NavigationLayout)}
              value={navigationLayout}
            >
              {navigationLayoutOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {t(option.labelKey)}
                </option>
              ))}
            </select>
          </label>

          <label>
            {t("menuBehavior")}
            <select
              onChange={(event) => setNavigationBehavior(event.target.value as NavigationBehavior)}
              value={navigationBehavior}
            >
              {navigationBehaviorOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {t(option.labelKey)}
                </option>
              ))}
            </select>
          </label>

          <label>
            {t("language")}
            <select
              onChange={(event) => setLanguage(event.target.value as Language)}
              value={language}
            >
              {languageOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div className="settings-form__group">
            <label>
              {t("dateFormat")}
              <select
                onChange={(event) => setDateFormat(event.target.value as DateFormat)}
                value={dateFormat}
              >
                {dateFormatOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {t(option.labelKey)}
                  </option>
                ))}
              </select>
            </label>
            <label className="checkbox-field">
              <input
                checked={showDate}
                onChange={(event) => setShowDate(event.target.checked)}
                type="checkbox"
              />
              {t("showDate")}
            </label>
            <label className="checkbox-field">
              <input
                checked={showTime}
                onChange={(event) => setShowTime(event.target.checked)}
                type="checkbox"
              />
              {t("showTime")}
            </label>
          </div>
        </div>

        <div className="settings-form__column">
          <div className="settings-form__group settings-form__group--first">
            <label>
              {t("density")}
              <select
                onChange={(event) => setDensity(event.target.value as DisplayDensity)}
                value={density}
              >
                {densityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {t(option.labelKey)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {t("contentWidth")}
              <select
                onChange={(event) => setContentWidth(event.target.value as ContentWidth)}
                value={contentWidth}
              >
                {contentWidthOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {t(option.labelKey)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {t("buttonSize")}
              <select
                onChange={(event) => setButtonSize(event.target.value as ButtonSize)}
                value={buttonSize}
              >
                {buttonSizeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {t(option.labelKey)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {t("fontSize")}
              <select
                onChange={(event) => setFontSize(event.target.value as FontSize)}
                value={fontSize}
              >
                {fontSizeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {t(option.labelKey)}
                  </option>
                ))}
              </select>
            </label>
            <label className="checkbox-field">
              <input
                checked={tableStripes}
                onChange={(event) => setTableStripes(event.target.checked)}
                type="checkbox"
              />
              {t("tableStripes")}
            </label>
            <label>
              {t("tablePageSize")}
              <select
                onChange={(event) => setTablePageSize(Number(event.target.value) as TablePageSize)}
                value={tablePageSize}
              >
                {tablePageSizeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="checkbox-field">
              <input
                checked={reduceMotion}
                onChange={(event) => setReduceMotion(event.target.checked)}
                type="checkbox"
              />
              {t("reduceMotion")}
            </label>
            <p className="settings-form__help">{t("reduceMotionHelp")}</p>
            <label className="checkbox-field">
              <input
                checked={showButtonIcons}
                onChange={(event) => setShowButtonIcons(event.target.checked)}
                type="checkbox"
              />
              {t("buttonIcons")}
            </label>
          </div>
        </div>
      </form>
    </section>
  );
}
