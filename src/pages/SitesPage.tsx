import { useEffect, useState } from "react";
import { Link } from "react-router";
import { ApiError } from "../api/httpClient";
import { deleteSite, getSites, getSiteUsage } from "../api/siteApi";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import DraggableDialog from "../components/ui/DraggableDialog";
import SortableHeader, { useTableSort } from "../components/ui/SortableHeader";
import type { Site, SiteUsage } from "../models/site";
import { usePreferences } from "../preferences/PreferencesContext";
import { useSiteContext } from "../sites/SiteContext";

function getUsageDetails(value: unknown): SiteUsage | null {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  if (typeof record.deletable !== "boolean") return null;
  return Object.entries(record).every(([key, item]) => key === "deletable" || typeof item === "number") ? record as SiteUsage : null;
}

function blockerCounts(usage: SiteUsage) {
  return Object.entries(usage).filter(([key, value]) => key !== "deletable" && typeof value === "number");
}

export default function SitesPage() {
  const { t } = usePreferences();
  const { selectedSite, selectSite, reloadSites } = useSiteContext();
  const [sites, setSites] = useState<Site[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [siteToDelete, setSiteToDelete] = useState<Site | null>(null);
  const [blockedUsage, setBlockedUsage] = useState<SiteUsage | null>(null);
  const [isCheckingUsage, setIsCheckingUsage] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { getAriaSort, sort, sortedItems: sortedSites, toggleSort } = useTableSort(sites);

  async function loadSites() {
    setIsLoading(true); setError("");
    try { setSites(await getSites()); }
    catch (caughtError) { setError(caughtError instanceof ApiError ? caughtError.message : t("sitesCouldNotBeLoaded")); }
    finally { setIsLoading(false); }
  }

  useEffect(() => { void loadSites(); }, []);

  async function startDelete(site: Site) {
    setError(""); setBlockedUsage(null); setIsCheckingUsage(site.code);
    try {
      const usage = await getSiteUsage(site.code);
      setSiteToDelete(site);
      if (!usage.deletable) setBlockedUsage(usage);
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : t("siteUsageCouldNotBeLoaded"));
    } finally { setIsCheckingUsage(null); }
  }

  async function confirmDelete() {
    if (!siteToDelete || isDeleting) return;
    setError(""); setIsDeleting(true);
    try {
      await deleteSite(siteToDelete.code);
      await reloadSites();
      await loadSites();
      setSiteToDelete(null);
    } catch (caughtError) {
      if (caughtError instanceof ApiError && caughtError.status === 409 && caughtError.code === "SITE_IN_USE") {
        const usage = getUsageDetails(caughtError.details);
        if (usage) setBlockedUsage(usage);
        else {
          try { setBlockedUsage(await getSiteUsage(siteToDelete.code)); }
          catch { setError(caughtError.message); setSiteToDelete(null); }
        }
      } else {
        setError(caughtError instanceof ApiError ? caughtError.message : t("siteCouldNotBeDeleted"));
        setSiteToDelete(null);
      }
    } finally { setIsDeleting(false); }
  }

  function closeDeleteDialog() {
    if (!isDeleting) { setSiteToDelete(null); setBlockedUsage(null); }
  }

  return <section className="users-page">
    <div className="page-heading"><div><h2>{t("sites")}</h2><p>{t("manageSites")}</p></div><div className="page-actions"><button className="secondary-button" onClick={() => void loadSites()} type="button">{t("refresh")}</button><Link className="button-link" to="/sites/new">{t("newSite")}</Link></div></div>
    {error && <div className="error-message">{error}</div>}
    <div className="users-table-wrap">
      {isLoading ? <div className="inline-status">{t("loadingSites")}</div> : sortedSites.length === 0 ? <div className="inline-status">{t("noSites")}</div> : <table className="users-table"><thead><tr>
        <th aria-sort={getAriaSort("code")}><SortableHeader direction={sort?.key === "code" ? sort.direction : null} label={t("code")} onClick={() => toggleSort("code")} /></th>
        <th aria-sort={getAriaSort("name")}><SortableHeader direction={sort?.key === "name" ? sort.direction : null} label={t("name")} onClick={() => toggleSort("name")} /></th>
        <th aria-sort={getAriaSort("active")}><SortableHeader direction={sort?.key === "active" ? sort.direction : null} label={t("active")} onClick={() => toggleSort("active")} /></th><th>{t("actions")}</th>
      </tr></thead><tbody>{sortedSites.map((site) => <tr key={site.id}><td>{site.code}</td><td>{site.name}</td><td>{site.active ? t("yes") : t("inactive")}</td><td><div className="table-actions">
        <button className="secondary-button" disabled={selectedSite?.code === site.code} onClick={() => selectSite(site.code)} type="button">{selectedSite?.code === site.code ? t("selectedSite") : t("selectSite")}</button>
        <Link className="secondary-link" to={`/sites/${encodeURIComponent(site.code)}/edit`}>{t("edit")}</Link>
        <button className="danger-button" disabled={isCheckingUsage === site.code || isDeleting} onClick={() => void startDelete(site)} type="button">{isCheckingUsage === site.code ? t("checkingSiteUsage") : t("delete")}</button>
      </div></td></tr>)}</tbody></table>}
    </div>
    {siteToDelete && blockedUsage && <DraggableDialog labelledBy="site-delete-blocked-title"><div><h3 id="site-delete-blocked-title">{t("siteCannotBeDeleted")}</h3><p>{siteToDelete.name}</p><ul>{blockerCounts(blockedUsage).map(([key, count]) => <li key={key}>{key}: {count}</li>)}</ul></div><div className="confirm-dialog__actions"><button className="secondary-button" onClick={closeDeleteDialog} type="button">{t("close")}</button></div></DraggableDialog>}
    {siteToDelete && !blockedUsage && <ConfirmDialog cancelLabel={t("cancel")} confirmDisabled={isDeleting} confirmLabel={isDeleting ? t("deleting") : t("delete")} isDanger message={`${t("deleteSiteConfirm")} \"${siteToDelete.name}\"? ${t("deleteSiteWarning")}`} onCancel={closeDeleteDialog} onConfirm={() => void confirmDelete()} title={t("confirmDelete")} />}
  </section>;
}
