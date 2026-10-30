import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router";
import { ApiError } from "../api/httpClient";
import { createSite, getSite, getThemeDefinitions, updateSite } from "../api/siteApi";
import type { ThemeDefinition } from "../models/site";
import { usePreferences } from "../preferences/PreferencesContext";
import { useSiteContext } from "../sites/SiteContext";

export default function SiteFormPage() {
  const { siteCode } = useParams();
  const navigate = useNavigate();
  const { t } = usePreferences();
  const { reloadSites, selectSite } = useSiteContext();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [active, setActive] = useState(true);
  const [themeCode, setThemeCode] = useState("");
  const [themeDefinitions, setThemeDefinitions] = useState<ThemeDefinition[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(Boolean(siteCode));
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const definitions = await getThemeDefinitions();
        setThemeDefinitions(definitions);
        if (siteCode) {
          const site = await getSite(siteCode);
          setCode(site.code); setName(site.name); setActive(site.active); setThemeCode(site.themeCode);
        } else {
          setThemeCode(definitions.find((theme) => theme.code === "STANDARD")?.code ?? definitions[0]?.code ?? "");
        }
      } catch (caughtError) {
        setError(caughtError instanceof ApiError ? caughtError.message : t(siteCode ? "siteCouldNotBeLoaded" : "themeDefinitionsCouldNotBeLoaded"));
      } finally { setIsLoading(false); }
    })();
  }, [siteCode, t]);

  if (siteCode === "") return <Navigate replace to="/sites" />;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setIsSaving(true); setError("");
    try {
      const input = { code: code.trim(), name: name.trim(), active, themeCode };
      const saved = siteCode ? await updateSite(siteCode, input) : await createSite(input);
      await reloadSites(); selectSite(saved.code); navigate("/sites");
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : t("siteCouldNotBeSaved"));
    } finally { setIsSaving(false); }
  }

  const currentThemeIsKnown = themeDefinitions.some((theme) => theme.code === themeCode);

  return <section className="users-page"><div className="page-heading"><div><h2>{siteCode ? t("editSite") : t("createSite")}</h2><p>{siteCode ? t("updateSite") : t("siteCodeHelp")}</p></div><Link className="secondary-link" to="/sites">{t("backToSites")}</Link></div><form className="user-form" onSubmit={handleSubmit}>{isLoading ? <div className="inline-status">{t("loadingSite")}</div> : <>{error && <div className="error-message">{error}</div>}<label>{t("code")}<input onChange={(event) => setCode(event.target.value)} required value={code} /></label><label>{t("name")}<input onChange={(event) => setName(event.target.value)} required value={name} /></label><label>{t("siteTheme")}<select onChange={(event) => setThemeCode(event.target.value)} required value={themeCode}>{themeCode && !currentThemeIsKnown && <option value={themeCode}>{t("unsupportedTheme")} ({themeCode})</option>}{themeDefinitions.map((theme) => <option key={theme.code} value={theme.code}>{theme.name}</option>)}</select>{themeCode && !currentThemeIsKnown && <span className="field-help">{t("unsupportedThemeHelp")}</span>}</label><label className="checkbox-field"><input checked={active} onChange={(event) => setActive(event.target.checked)} type="checkbox" />{t("active")}</label><div className="form-actions"><button disabled={isSaving || themeDefinitions.length === 0} type="submit">{isSaving ? t("saving") : t("saveSite")}</button></div></>}</form></section>;
}
