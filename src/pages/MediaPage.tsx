import { Fragment, useEffect, useMemo, useState } from "react";
import { ApiError } from "../api/httpClient";
import * as mediaApi from "../api/mediaApi";
import ButtonLabel from "../components/ui/ButtonLabel";
import MediaUploadDialog from "../components/media/MediaUploadDialog";
import type { Media } from "../models/media";
import type { DateFormat } from "../preferences/PreferencesContext";
import { usePreferences } from "../preferences/PreferencesContext";

type SortDirection = "asc" | "desc";
type MediaSortKey = "originalFileName" | "mimeType" | "fileSize" | "storageType" | "createdAt";

type MediaSortState = {
  key: MediaSortKey;
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

function compareValues(left: string | number | null, right: string | number | null) {
  if (typeof left === "number" && typeof right === "number") {
    return left - right;
  }
  return String(left ?? "").localeCompare(String(right ?? ""));
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(0)} KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function MediaPage() {
  const { dateFormat, language, tablePageSize, t } = usePreferences();
  const [media, setMedia] = useState<Media[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingDeactivateMediaId, setPendingDeactivateMediaId] = useState<number | null>(null);
  const [detailsMediaId, setDetailsMediaId] = useState<number | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [sort, setSort] = useState<MediaSortState | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const sortedMedia = useMemo(() => {
    if (!sort) {
      return media;
    }

    return [...media].sort((left, right) => {
      const result = compareValues(left[sort.key], right[sort.key]);
      return sort.direction === "asc" ? result : -result;
    });
  }, [media, sort]);

  const totalPages = Math.max(1, Math.ceil(sortedMedia.length / tablePageSize));
  const paginatedMedia = useMemo(
    () => sortedMedia.slice((currentPage - 1) * tablePageSize, currentPage * tablePageSize),
    [currentPage, sortedMedia, tablePageSize],
  );

  async function loadMedia() {
    setIsLoading(true);
    setError("");

    try {
      setMedia(await mediaApi.getMediaList());
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, t("mediaCouldNotBeLoaded")));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadMedia();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [sort, tablePageSize]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  function handleSort(key: MediaSortKey) {
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

  function renderSortableHeader(key: MediaSortKey, label: string) {
    const isActive = sort?.key === key;
    const indicator = isActive ? (sort.direction === "asc" ? " ▲" : " ▼") : "";

    return (
      <button className="sortable-header" onClick={() => handleSort(key)} type="button">
        {label}
        <span aria-hidden="true">{indicator}</span>
      </button>
    );
  }

  function getAriaSort(key: MediaSortKey) {
    if (sort?.key !== key) {
      return "none";
    }

    return sort.direction === "asc" ? "ascending" : "descending";
  }

  async function handleDeactivate(mediaItem: Media) {
    setError("");
    setPendingDeactivateMediaId(mediaItem.id);

    try {
      const deactivatedMedia = await mediaApi.deleteMedia(mediaItem.id);
      setMedia((current) =>
        current.map((item) => (item.id === deactivatedMedia.id ? deactivatedMedia : item)),
      );
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, t("mediaCouldNotBeDeleted")));
    } finally {
      setPendingDeactivateMediaId(null);
    }
  }

  function getPreviewLabel(mimeType: string) {
    if (mimeType.startsWith("image/")) {
      return t("image");
    }

    if (mimeType === "application/pdf") {
      return t("pdf");
    }

    return t("other");
  }

  return (
    <section className="users-page media-page">
      <div className="page-heading">
        <div>
          <h2>{t("media")}</h2>
          <p>{t("manageMedia")}</p>
        </div>
        <div className="page-actions">
          <button className="secondary-button" onClick={() => void loadMedia()} type="button">
            <ButtonLabel icon="refresh">{t("refresh")}</ButtonLabel>
          </button>
          <button className="button-link" onClick={() => setIsUploadOpen(true)} type="button">
            <ButtonLabel icon="create">{t("uploadMedia")}</ButtonLabel>
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="users-table-wrap">
        {isLoading ? (
          <div className="inline-status">{t("loadingMedia")}</div>
        ) : paginatedMedia.length === 0 ? (
          <div className="inline-status">{t("noMedia")}</div>
        ) : (
          <table className="users-table">
            <thead>
              <tr>
                <th aria-sort={getAriaSort("originalFileName")}>
                  {renderSortableHeader("originalFileName", t("fileName"))}
                </th>
                <th aria-sort={getAriaSort("mimeType")}>{renderSortableHeader("mimeType", t("mimeType"))}</th>
                <th aria-sort={getAriaSort("fileSize")}>{renderSortableHeader("fileSize", t("size"))}</th>
                <th aria-sort={getAriaSort("storageType")}>{renderSortableHeader("storageType", t("storage"))}</th>
                <th aria-sort={getAriaSort("createdAt")}>{renderSortableHeader("createdAt", t("createdAt"))}</th>
                <th>{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {paginatedMedia.map((mediaItem) => (
                <Fragment key={mediaItem.id}>
                  <tr>
                    <td>{mediaItem.originalFileName}</td>
                    <td>
                      {getPreviewLabel(mediaItem.mimeType)} · {mediaItem.mimeType}
                    </td>
                    <td>{formatFileSize(mediaItem.fileSize)}</td>
                    <td>{mediaItem.storageType}</td>
                    <td>{formatDate(mediaItem.createdAt, language, dateFormat)}</td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="secondary-button"
                          onClick={() => setDetailsMediaId((current) => (current === mediaItem.id ? null : mediaItem.id))}
                          type="button"
                        >
                          <ButtonLabel icon="edit">{t("details")}</ButtonLabel>
                        </button>
                        <button
                          className="danger-button"
                          disabled={pendingDeactivateMediaId === mediaItem.id || !mediaItem.active}
                          onClick={() => void handleDeactivate(mediaItem)}
                          type="button"
                        >
                          <ButtonLabel icon="deactivate">{t("deactivate")}</ButtonLabel>
                        </button>
                      </div>
                    </td>
                  </tr>
                  {detailsMediaId === mediaItem.id && (
                    <tr className="media-details-row" key={`${mediaItem.id}-details`}>
                      <td colSpan={6}>
                        <div className="user-form">
                          <strong>{t("description")}</strong>
                          <p>{mediaItem.description ?? t("no")}</p>
                          <strong>{t("active")}</strong>
                          <p>{mediaItem.active ? t("yes") : t("no")}</p>
                          <strong>{t("updatedAt")}</strong>
                          <p>{formatDate(mediaItem.updatedAt, language, dateFormat)}</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isUploadOpen && (
        <MediaUploadDialog
          onClose={() => setIsUploadOpen(false)}
          onUploadSuccess={() => void loadMedia()}
        />
      )}
    </section>
  );
}
