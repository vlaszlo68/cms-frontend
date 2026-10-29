import { useEffect, useState } from "react";
import { Link } from "react-router";
import { ApiError } from "../api/httpClient";
import * as applicationApi from "../api/applicationApi";
import ButtonLabel from "../components/ui/ButtonLabel";
import SortableHeader, { useTableSort } from "../components/ui/SortableHeader";
import type { Application } from "../models/application";
import { usePreferences } from "../preferences/PreferencesContext";
import { useSiteContext } from "../sites/SiteContext";

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

export default function ApplicationsPage() {
  const { t } = usePreferences();
  const { selectedSite } = useSiteContext();
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const { getAriaSort, sort, sortedItems: sortedApplications, toggleSort } = useTableSort(applications);

  async function loadApplications() {
    setIsLoading(true);
    setError("");
    try {
      setApplications(selectedSite ? await applicationApi.getApplications(selectedSite.code) : []);
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, t("applicationsCouldNotBeLoaded")));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadApplications();
  }, [selectedSite?.code]);

  return (
    <section className="users-page">
      <div className="page-heading">
        <div>
          <h2>{t("applications")}</h2>
          <p>{t("manageApplications")}</p>
        </div>
        <div className="page-actions">
          <button className="secondary-button" onClick={() => void loadApplications()} type="button">
            <ButtonLabel icon="refresh">{t("refresh")}</ButtonLabel>
          </button>
          <Link className="button-link" to="/applications/new">
            <ButtonLabel icon="create">{t("newApplication")}</ButtonLabel>
          </Link>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="users-table-wrap">
        {isLoading ? (
          <div className="inline-status">{t("loadingApplications")}</div>
        ) : sortedApplications.length === 0 ? (
          <div className="inline-status">{t("noApplications")}</div>
        ) : (
          <table className="users-table">
            <thead>
              <tr>
                <th aria-sort={getAriaSort("name")}><SortableHeader direction={sort?.key === "name" ? sort.direction : null} label={t("name")} onClick={() => toggleSort("name")} /></th>
                <th aria-sort={getAriaSort("code")}><SortableHeader direction={sort?.key === "code" ? sort.direction : null} label={t("code")} onClick={() => toggleSort("code")} /></th>
                <th aria-sort={getAriaSort("active")}><SortableHeader direction={sort?.key === "active" ? sort.direction : null} label={t("active")} onClick={() => toggleSort("active")} /></th>
                <th>{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {sortedApplications.map((application) => (
                <tr key={application.id}>
                  <td>{application.name}</td>
                  <td>{application.code}</td>
                  <td>{application.active ? t("yes") : t("no")}</td>
                  <td><Link className="secondary-link" to={`/applications/${application.id}/edit`}><ButtonLabel icon="edit">{t("edit")}</ButtonLabel></Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
