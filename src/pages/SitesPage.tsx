import { useEffect, useState } from "react";
import { Link } from "react-router";
import { ApiError } from "../api/httpClient";
import { getSites } from "../api/siteApi";
import SortableHeader, { useTableSort } from "../components/ui/SortableHeader";
import type { Site } from "../models/site";
import { usePreferences } from "../preferences/PreferencesContext";
import { useSiteContext } from "../sites/SiteContext";

export default function SitesPage() {
  const { t } = usePreferences();
  const { selectedSite, selectSite } = useSiteContext();
  const [sites, setSites] = useState<Site[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { getAriaSort, sort, sortedItems: sortedSites, toggleSort } = useTableSort(sites);

  async function loadSites() {
    setIsLoading(true);
    setError("");
    try {
      setSites(await getSites());
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : t("sitesCouldNotBeLoaded"));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadSites();
  }, []);

  return (
    <section className="users-page">
      <div className="page-heading">
        <div><h2>{t("sites")}</h2><p>{t("manageSites")}</p></div>
        <div className="page-actions">
          <button className="secondary-button" onClick={() => void loadSites()} type="button">{t("refresh")}</button>
          <Link className="button-link" to="/sites/new">{t("newSite")}</Link>
        </div>
      </div>
      {error && <div className="error-message">{error}</div>}
      <div className="users-table-wrap">
        {isLoading ? <div className="inline-status">{t("loadingSites")}</div> : sortedSites.length === 0 ? <div className="inline-status">{t("noSites")}</div> : (
          <table className="users-table">
            <thead><tr>
              <th aria-sort={getAriaSort("code")}><SortableHeader direction={sort?.key === "code" ? sort.direction : null} label={t("code")} onClick={() => toggleSort("code")} /></th>
              <th aria-sort={getAriaSort("name")}><SortableHeader direction={sort?.key === "name" ? sort.direction : null} label={t("name")} onClick={() => toggleSort("name")} /></th>
              <th aria-sort={getAriaSort("active")}><SortableHeader direction={sort?.key === "active" ? sort.direction : null} label={t("active")} onClick={() => toggleSort("active")} /></th>
              <th>{t("actions")}</th>
            </tr></thead>
            <tbody>{sortedSites.map((site) => <tr key={site.id}>
              <td>{site.code}</td><td>{site.name}</td><td>{site.active ? t("yes") : t("inactive")}</td>
              <td><div className="table-actions">
                <button className="secondary-button" disabled={selectedSite?.code === site.code} onClick={() => selectSite(site.code)} type="button">{selectedSite?.code === site.code ? t("selectedSite") : t("selectSite")}</button>
                <Link className="secondary-link" to={`/sites/${encodeURIComponent(site.code)}/edit`}>{t("edit")}</Link>
              </div></td>
            </tr>)}</tbody>
          </table>
        )}
      </div>
    </section>
  );
}
