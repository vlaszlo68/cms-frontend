import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router";
import { ApiError } from "../api/httpClient";
import { createSite, getSite, updateSite } from "../api/siteApi";
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
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(Boolean(siteCode));
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!siteCode) return;
    void (async () => {
      try {
        const site = await getSite(siteCode);
        setCode(site.code); setName(site.name); setActive(site.active);
      } catch (caughtError) {
        setError(caughtError instanceof ApiError ? caughtError.message : t("siteCouldNotBeLoaded"));
      } finally { setIsLoading(false); }
    })();
  }, [siteCode, t]);

  if (siteCode === "") return <Navigate replace to="/sites" />;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setIsSaving(true); setError("");
    try {
      const input = { code: code.trim(), name: name.trim(), active };
      const saved = siteCode ? await updateSite(siteCode, input) : await createSite(input);
      await reloadSites(); selectSite(saved.code); navigate("/sites");
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : t("siteCouldNotBeSaved"));
    } finally { setIsSaving(false); }
  }

  return <section className="users-page"><div className="page-heading"><div><h2>{siteCode ? t("editSite") : t("createSite")}</h2><p>{siteCode ? t("updateSite") : t("siteCodeHelp")}</p></div><Link className="secondary-link" to="/sites">{t("backToSites")}</Link></div><form className="user-form" onSubmit={handleSubmit}>{isLoading ? <div className="inline-status">{t("loadingSite")}</div> : <>{error && <div className="error-message">{error}</div>}<label>{t("code")}<input onChange={(event) => setCode(event.target.value)} required value={code} /></label><label>{t("name")}<input onChange={(event) => setName(event.target.value)} required value={name} /></label><label className="checkbox-field"><input checked={active} onChange={(event) => setActive(event.target.checked)} type="checkbox" />{t("active")}</label><div className="form-actions"><button disabled={isSaving} type="submit">{isSaving ? t("saving") : t("saveSite")}</button></div></>}</form></section>;
}
