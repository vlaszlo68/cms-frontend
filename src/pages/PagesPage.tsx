import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { ApiError } from "../api/httpClient";
import * as pageApi from "../api/pageApi";
import ButtonLabel from "../components/ui/ButtonLabel";
import type { Page } from "../models/page";
import type { DateFormat } from "../preferences/PreferencesContext";
import { usePreferences } from "../preferences/PreferencesContext";

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

function formatDate(value: string | null, language: string, dateFormat: DateFormat) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat(language === "hu" ? "hu-HU" : "en-US", {
    dateStyle: dateFormat === "long" ? "full" : "medium",
    timeStyle: dateFormat === "long" ? "medium" : "short",
  }).format(new Date(value));
}

export default function PagesPage() {
  const { dateFormat, language, t } = usePreferences();
  const [pages, setPages] = useState<Page[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingDeletePageId, setPendingDeletePageId] = useState<number | null>(null);

  const sortedPages = useMemo(
    () => [...pages].sort((left, right) => left.title.localeCompare(right.title)),
    [pages],
  );

  async function loadPages() {
    setIsLoading(true);
    setError("");

    try {
      setPages(await pageApi.getPages());
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, t("pagesCouldNotBeLoaded")));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadPages();
  }, []);

  async function handleDelete(page: Page) {
    const confirmed = window.confirm(`${t("deletePageConfirm")} ${page.title}?`);

    if (!confirmed) {
      return;
    }

    setError("");
    setPendingDeletePageId(page.id);

    try {
      await pageApi.deletePage(page.id);
      setPages((current) => current.filter((item) => item.id !== page.id));
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, t("pageCouldNotBeDeleted")));
    } finally {
      setPendingDeletePageId(null);
    }
  }

  return (
    <section className="users-page">
      <div className="page-heading">
        <div>
          <h2>{t("pages")}</h2>
          <p>{t("managePages")}</p>
        </div>
        <div className="page-actions">
          <button className="secondary-button" onClick={() => void loadPages()} type="button">
            <ButtonLabel icon="refresh">{t("refresh")}</ButtonLabel>
          </button>
          <Link className="button-link" to="/pages/new">
            <ButtonLabel icon="create">{t("newPage")}</ButtonLabel>
          </Link>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="users-table-wrap">
        {isLoading ? (
          <div className="inline-status">{t("loadingPages")}</div>
        ) : sortedPages.length === 0 ? (
          <div className="inline-status">{t("noPages")}</div>
        ) : (
          <table className="users-table">
            <thead>
              <tr>
                <th>{t("title")}</th>
                <th>{t("slug")}</th>
                <th>{t("status")}</th>
                <th>{t("homepage")}</th>
                <th>{t("menuVisible")}</th>
                <th>{t("updatedAt")}</th>
                <th>{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {sortedPages.map((page) => (
                <tr key={page.id}>
                  <td>{page.title}</td>
                  <td>{page.slug}</td>
                  <td>{page.status}</td>
                  <td>{page.homepage ? t("yes") : t("no")}</td>
                  <td>{page.menuVisible ? t("yes") : t("no")}</td>
                  <td>{formatDate(page.updatedAt, language, dateFormat)}</td>
                  <td>
                    <div className="table-actions">
                      <Link className="secondary-link" to={`/pages/${page.id}/edit`}>
                        <ButtonLabel icon="edit">{t("edit")}</ButtonLabel>
                      </Link>
                      <button
                        className="danger-button"
                        disabled={pendingDeletePageId === page.id}
                        onClick={() => void handleDelete(page)}
                        type="button"
                      >
                        <ButtonLabel icon="deactivate">{t("delete")}</ButtonLabel>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
