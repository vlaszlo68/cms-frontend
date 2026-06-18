import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { ApiError } from "../api/httpClient";
import * as pageApi from "../api/pageApi";
import ButtonLabel from "../components/ui/ButtonLabel";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import type { PageListItem } from "../models/page";
import type { DateFormat } from "../preferences/PreferencesContext";
import { usePreferences } from "../preferences/PreferencesContext";

type SortDirection = "asc" | "desc";
type PageSortKey =
  | "title"
  | "slug"
  | "status"
  | "pageType"
  | "homepage"
  | "menuVisible"
  | "updatedAt";

type PageSortState = {
  key: PageSortKey;
  direction: SortDirection;
};

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

function compareValues(left: string | boolean | null, right: string | boolean | null) {
  if (typeof left === "boolean" && typeof right === "boolean") {
    return Number(left) - Number(right);
  }

  return String(left ?? "").localeCompare(String(right ?? ""));
}

export default function PagesPage() {
  const { dateFormat, language, tablePageSize, t } = usePreferences();
  const [pages, setPages] = useState<PageListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingDeletePageId, setPendingDeletePageId] = useState<number | null>(null);
  const [pageToDelete, setPageToDelete] = useState<PageListItem | null>(null);
  const [sort, setSort] = useState<PageSortState | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const sortedPages = useMemo(
    () => {
      if (!sort) {
        return pages;
      }

      return [...pages].sort((left, right) => {
        const result = compareValues(left[sort.key], right[sort.key]);
        return sort.direction === "asc" ? result : -result;
      });
    },
    [pages, sort],
  );
  const totalPages = Math.max(1, Math.ceil(sortedPages.length / tablePageSize));
  const paginatedPages = useMemo(
    () =>
      sortedPages.slice((currentPage - 1) * tablePageSize, currentPage * tablePageSize),
    [currentPage, sortedPages, tablePageSize],
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

  useEffect(() => {
    setCurrentPage(1);
  }, [sort, tablePageSize]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  function handleSort(key: PageSortKey) {
    setSort((current) => {
      if (current?.key !== key) {
        return { key, direction: "asc" };
      }

      if (current.direction === "asc") {
        return { key, direction: "desc" };
      }

      return null;
    });
  }

  function renderSortableHeader(key: PageSortKey, label: string) {
    const isActive = sort?.key === key;
    const indicator = isActive ? (sort.direction === "asc" ? " ▲" : " ▼") : "";

    return (
      <button className="sortable-header" onClick={() => handleSort(key)} type="button">
        {label}
        <span aria-hidden="true">{indicator}</span>
      </button>
    );
  }

  function getAriaSort(key: PageSortKey) {
    if (sort?.key !== key) {
      return "none";
    }

    return sort.direction === "asc" ? "ascending" : "descending";
  }

  async function handleDelete(page: PageListItem) {
    setError("");
    setPendingDeletePageId(page.id);

    try {
      await pageApi.deletePage(page.id);
      setPages((current) => current.filter((item) => item.id !== page.id));
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, t("pageCouldNotBeDeleted")));
    } finally {
      setPendingDeletePageId(null);
      setPageToDelete(null);
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
          <>
            <table className="users-table">
              <thead>
                <tr>
                  <th aria-sort={getAriaSort("title")}>
                    {renderSortableHeader("title", t("title"))}
                  </th>
                  <th aria-sort={getAriaSort("slug")}>
                    {renderSortableHeader("slug", t("slug"))}
                  </th>
                  <th aria-sort={getAriaSort("status")}>
                    {renderSortableHeader("status", t("status"))}
                  </th>
                  <th aria-sort={getAriaSort("pageType")}>
                    {renderSortableHeader("pageType", t("pageType"))}
                  </th>
                  <th aria-sort={getAriaSort("homepage")}>
                    {renderSortableHeader("homepage", t("homepage"))}
                  </th>
                  <th aria-sort={getAriaSort("menuVisible")}>
                    {renderSortableHeader("menuVisible", t("menuVisible"))}
                  </th>
                  <th aria-sort={getAriaSort("updatedAt")}>
                    {renderSortableHeader("updatedAt", t("updatedAt"))}
                  </th>
                  <th>{t("actions")}</th>
                </tr>
              </thead>
              <tbody>
                {paginatedPages.map((page) => (
                  <tr key={page.id}>
                    <td>{page.title}</td>
                    <td>{page.slug}</td>
                    <td>{page.status}</td>
                    <td>{page.pageType || "CONTENT"}</td>
                    <td>{page.homepage ? t("yes") : t("no")}</td>
                    <td>{page.menuVisible ? t("yes") : t("no")}</td>
                    <td>{formatDate(page.updatedAt, language, dateFormat)}</td>
                    <td>
                      <div className="table-actions">
                        <Link className="secondary-link" to={`/pages/${page.id}/edit`}>
                          <ButtonLabel icon="edit">{t("edit")}</ButtonLabel>
                        </Link>
                        {(page.pageType || "CONTENT") === "BLOCK" && (
                          <Link
                            className="secondary-link"
                            to={`/pages/${page.id}/blocks`}
                          >
                            <ButtonLabel icon="edit">{t("blocks")}</ButtonLabel>
                          </Link>
                        )}
                        <button
                          className="danger-button"
                          disabled={pendingDeletePageId === page.id}
                          onClick={() => setPageToDelete(page)}
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
            <div className="table-pagination">
              <button
                className="secondary-button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                type="button"
              >
                {t("previousPage")}
              </button>
              <span>
                {currentPage} / {totalPages}
              </span>
              <button
                className="secondary-button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                type="button"
              >
                {t("nextPage")}
              </button>
            </div>
          </>
        )}
      </div>
      {pageToDelete && (
        <ConfirmDialog
          cancelLabel={t("cancel")}
          confirmLabel={t("delete")}
          isDanger
          message={`${t("deletePageConfirm")} ${pageToDelete.title}?`}
          onCancel={() => setPageToDelete(null)}
          onConfirm={() => void handleDelete(pageToDelete)}
          title={t("confirmDelete")}
        />
      )}
    </section>
  );
}
