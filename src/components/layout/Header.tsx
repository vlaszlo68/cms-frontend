import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../auth/AuthContext";
import ButtonLabel from "../ui/ButtonLabel";
import type { Language } from "../../i18n/translations";
import type { DateFormat } from "../../preferences/PreferencesContext";
import { usePreferences } from "../../preferences/PreferencesContext";
import { useSiteContext } from "../../sites/SiteContext";

function formatHeaderDateTime(
  value: Date,
  language: Language,
  dateFormat: DateFormat,
  showDate: boolean,
  showTime: boolean,
) {
  const options: Intl.DateTimeFormatOptions = {};

  if (showDate) {
    options.dateStyle = dateFormat === "long" ? "full" : "medium";
  }

  if (showTime) {
    options.timeStyle = dateFormat === "long" ? "medium" : "short";
  }

  return new Intl.DateTimeFormat(language === "hu" ? "hu-HU" : "en-US", {
    ...options,
  }).format(value);
}

/**
 * Renders the authenticated app header with account information and logout action.
 */
export default function Header() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { dateFormat, language, showDate, showTime, t } = usePreferences();
  const { sites, selectedSite, selectSite, isLoading: sitesLoading } = useSiteContext();
  const [now, setNow] = useState(() => new Date());
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const shouldShowClock = showDate || showTime;

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  /**
   * Logs the user out and returns them to the login route.
   */
  async function handleLogout() {
    setIsLoggingOut(true);

    try {
      await logout();
      navigate("/login", { replace: true });
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <header className="app-header">
      <div>
        <span className="app-kicker">CMS</span>
        <h1>CMS Admin</h1>
      </div>
      <div className="app-header__user">
        {shouldShowClock && (
          <time className="app-header__clock" dateTime={now.toISOString()}>
            {formatHeaderDateTime(now, language, dateFormat, showDate, showTime)}
          </time>
        )}
        {user?.role === "ADMIN" && <label className="site-selector">{t("site")} <select aria-label={t("selectedSite")} disabled={sitesLoading || sites.length === 0} onChange={(event) => { selectSite(event.target.value); if (/^\/(pages|menus)(\/|$)/.test(location.pathname) || location.pathname === "/media" || location.pathname === "/site-settings") navigate(location.pathname.includes("menus") ? "/menus" : location.pathname.includes("pages") ? "/pages" : location.pathname); }} value={selectedSite?.code ?? ""}><option value="">{sitesLoading ? t("loadingSites") : t("noSiteSelected")}</option>{sites.map(site => <option key={site.code} value={site.code}>{site.name} ({site.code}){site.active ? "" : ` — ${t("inactive")}`}</option>)}</select></label>}
        <span className="app-header__login-name">{user?.loginName}</span>
        <button
          className="secondary-button"
          disabled={isLoggingOut}
          onClick={handleLogout}
          type="button"
        >
          <ButtonLabel icon="logout">{t("logout")}</ButtonLabel>
        </button>
      </div>
    </header>
  );
}
