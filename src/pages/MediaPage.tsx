import { useEffect, useMemo, useState } from "react";
import { ApiError } from "../api/httpClient";
import * as mediaApi from "../api/mediaApi";
import ButtonLabel from "../components/ui/ButtonLabel";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import DraggableDialog from "../components/ui/DraggableDialog";
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
  const [pendingDeleteMediaId, setPendingDeleteMediaId] = useState<number | null>(null);
  const [mediaToDelete, setMediaToDelete] = useState<Media | null>(null);
  const [mediaToShowDetails, setMediaToShowDetails] = useState<Media | null>(null);
  const [mediaToPreview, setMediaToPreview] = useState<Media | null>(null);
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

  async function handleDelete(mediaItem: Media) {
    setError("");
    setPendingDeleteMediaId(mediaItem.id);

    try {
      await mediaApi.deleteMedia(mediaItem.id);
      setMedia((current) => current.filter((item) => item.id !== mediaItem.id));
      setMediaToShowDetails((current) => (current?.id === mediaItem.id ? null : current));
      setMediaToPreview((current) => (current?.id === mediaItem.id ? null : current));
      setMediaToDelete(null);
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, t("mediaCouldNotBeDeleted")));
    } finally {
      setPendingDeleteMediaId(null);
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

  function getContentUrl(mediaItem: Media) {
    return `/api/media/${mediaItem.id}/content`;
  }

  function renderPreviewContent(mediaItem: Media) {
    const contentUrl = getContentUrl(mediaItem);

    if (mediaItem.mimeType.startsWith("image/")) {
      return (
        <img
          alt={mediaItem.originalFileName}
          className="media-preview-dialog__image"
          src={contentUrl}
        />
      );
    }

    if (mediaItem.mimeType === "application/pdf") {
      return (
        <iframe
          className="media-preview-dialog__frame"
          src={contentUrl}
          title={mediaItem.originalFileName}
        />
      );
    }

    return (
      <div className="media-preview-dialog__fallback">
        <p>{t("mediaPreviewNotAvailable")}</p>
        <a className="secondary-link" href={contentUrl} rel="noopener noreferrer" target="_blank">
          {t("openMediaContent")}
        </a>
      </div>
    );
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
        ) : sortedMedia.length === 0 ? (
          <div className="inline-status">{t("noMedia")}</div>
        ) : (
          <>
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
                <tr key={mediaItem.id}>
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
                          onClick={() => setMediaToShowDetails(mediaItem)}
                          type="button"
                        >
                          <ButtonLabel icon="edit">{t("details")}</ButtonLabel>
                        </button>
                        <button
                          className="danger-button"
                          disabled={pendingDeleteMediaId === mediaItem.id}
                          onClick={() => setMediaToDelete(mediaItem)}
                          type="button"
                        >
                          <ButtonLabel icon="delete">{t("delete")}</ButtonLabel>
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

      {isUploadOpen && (
        <MediaUploadDialog
          onClose={() => setIsUploadOpen(false)}
          onUploadSuccess={() => void loadMedia()}
        />
      )}

      {mediaToDelete && (
        <ConfirmDialog
          cancelLabel={t("cancel")}
          confirmLabel={t("delete")}
          isDanger
          message={`${t("deleteMediaConfirm")} ${mediaToDelete.originalFileName}?`}
          onCancel={() => setMediaToDelete(null)}
          onConfirm={() => void handleDelete(mediaToDelete)}
          title={t("confirmDelete")}
        />
      )}

      {mediaToShowDetails && (
        <DraggableDialog className="media-details-dialog" labelledBy="media-details-dialog-title">
            <div>
              <h3 id="media-details-dialog-title">{mediaToShowDetails.originalFileName}</h3>
              <p>{getPreviewLabel(mediaToShowDetails.mimeType)} - {mediaToShowDetails.mimeType}</p>
            </div>
            <dl className="media-details-list">
              <div>
                <dt>{t("description")}</dt>
                <dd>{mediaToShowDetails.description ?? t("no")}</dd>
              </div>
              <div>
                <dt>{t("size")}</dt>
                <dd>{formatFileSize(mediaToShowDetails.fileSize)}</dd>
              </div>
              <div>
                <dt>{t("storage")}</dt>
                <dd>{mediaToShowDetails.storageType}</dd>
              </div>
              <div>
                <dt>{t("active")}</dt>
                <dd>{mediaToShowDetails.active ? t("yes") : t("no")}</dd>
              </div>
              <div>
                <dt>{t("createdAt")}</dt>
                <dd>{formatDate(mediaToShowDetails.createdAt, language, dateFormat)}</dd>
              </div>
              <div>
                <dt>{t("updatedAt")}</dt>
                <dd>{formatDate(mediaToShowDetails.updatedAt, language, dateFormat)}</dd>
              </div>
            </dl>
            <div className="confirm-dialog__actions">
              <button
                className="secondary-button"
                onClick={() => setMediaToPreview(mediaToShowDetails)}
                type="button"
              >
                <ButtonLabel icon="preview">{t("preview")}</ButtonLabel>
              </button>
              <button
                className="secondary-button"
                onClick={() => setMediaToShowDetails(null)}
                type="button"
              >
                <ButtonLabel icon="cancel">{t("cancel")}</ButtonLabel>
              </button>
            </div>
        </DraggableDialog>
      )}

      {mediaToPreview && (
        <DraggableDialog className="media-preview-dialog" labelledBy="media-preview-dialog-title">
            <div>
              <h3 id="media-preview-dialog-title">{mediaToPreview.originalFileName}</h3>
              <p>
                {getPreviewLabel(mediaToPreview.mimeType)} - {formatFileSize(mediaToPreview.fileSize)}
              </p>
            </div>
            <div className="media-preview-dialog__body">
              {renderPreviewContent(mediaToPreview)}
            </div>
            <div className="confirm-dialog__actions">
              <a
                className="secondary-link"
                href={getContentUrl(mediaToPreview)}
                rel="noopener noreferrer"
                target="_blank"
              >
                {t("openMediaContent")}
              </a>
              <button
                className="secondary-button"
                onClick={() => setMediaToPreview(null)}
                type="button"
              >
                <ButtonLabel icon="cancel">{t("cancel")}</ButtonLabel>
              </button>
            </div>
        </DraggableDialog>
      )}
    </section>
  );
}
