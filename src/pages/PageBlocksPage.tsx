import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router";
import { ApiError } from "../api/httpClient";
import * as pageApi from "../api/pageApi";
import * as pageBlockApi from "../api/pageBlockApi";
import ButtonLabel from "../components/ui/ButtonLabel";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import type { Page } from "../models/page";
import type { PageBlock } from "../models/pageBlock";
import { usePreferences } from "../preferences/PreferencesContext";

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

export default function PageBlocksPage() {
  const { t } = usePreferences();
  const { id } = useParams();
  const pageId = id === undefined ? null : Number(id);
  const hasInvalidId =
    pageId === null || !Number.isInteger(pageId) || pageId <= 0;
  const [page, setPage] = useState<Page | null>(null);
  const [blocks, setBlocks] = useState<PageBlock[]>([]);
  const [blockToDelete, setBlockToDelete] = useState<PageBlock | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const sortedBlocks = useMemo(
    () =>
      [...blocks].sort(
        (left, right) =>
          left.sortOrder - right.sortOrder ||
          (left.title ?? "").localeCompare(right.title ?? ""),
      ),
    [blocks],
  );

  async function loadData(targetPageId: number) {
    setIsLoading(true);
    setError("");

    try {
      const [loadedPage, loadedBlocks] = await Promise.all([
        pageApi.getPage(targetPageId),
        pageBlockApi.getBlocks(targetPageId),
      ]);
      setPage(loadedPage);
      setBlocks(loadedBlocks);
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, t("pageBlocksCouldNotBeLoaded")));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!hasInvalidId && pageId) {
      void loadData(pageId);
    }
  }, [hasInvalidId, pageId]);

  if (hasInvalidId) {
    return <Navigate replace to="/pages" />;
  }

  const validPageId = pageId as number;

  async function handleDelete(block: PageBlock) {
    setError("");
    setPendingDeleteId(block.id);

    try {
      await pageBlockApi.deleteBlock(block.id);
      setBlocks((current) => current.filter((item) => item.id !== block.id));
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, t("pageBlockCouldNotBeDeleted")));
    } finally {
      setPendingDeleteId(null);
      setBlockToDelete(null);
    }
  }

  return (
    <section className="users-page">
      <div className="page-heading">
        <div>
          <h2>
            {t("pageBlocks")}
            {page ? ` — ${page.title}` : ""}
          </h2>
          <p>{t("managePageBlocks")}</p>
        </div>
        <div className="page-actions">
          <button
            className="secondary-button"
            onClick={() => void loadData(validPageId)}
            type="button"
          >
            <ButtonLabel icon="refresh">{t("refresh")}</ButtonLabel>
          </button>
          <Link className="button-link" to={`/pages/${validPageId}/blocks/new`}>
            <ButtonLabel icon="create">{t("newPageBlock")}</ButtonLabel>
          </Link>
          <Link className="secondary-link" to="/pages">
            <ButtonLabel icon="back">{t("backToPages")}</ButtonLabel>
          </Link>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="users-table-wrap">
        {isLoading ? (
          <div className="inline-status">{t("loadingPageBlocks")}</div>
        ) : sortedBlocks.length === 0 ? (
          <div className="inline-status">{t("noPageBlocks")}</div>
        ) : (
          <table className="users-table users-table--page-blocks">
            <thead>
              <tr>
                <th>{t("title")}</th>
                <th>{t("blockType")}</th>
                <th>{t("sortOrder")}</th>
                <th>{t("visible")}</th>
                <th>{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {sortedBlocks.map((block) => (
                <tr key={block.id}>
                  <td>{block.title || "-"}</td>
                  <td>{block.blockType}</td>
                  <td>{block.sortOrder}</td>
                  <td>{block.visible ? t("yes") : t("no")}</td>
                  <td>
                    <div className="table-actions">
                      <Link
                        className="secondary-link"
                        to={`/pages/${validPageId}/blocks/${block.id}/edit`}
                      >
                        <ButtonLabel icon="edit">{t("edit")}</ButtonLabel>
                      </Link>
                      <button
                        className="danger-button"
                        disabled={pendingDeleteId === block.id}
                        onClick={() => setBlockToDelete(block)}
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
        )}
      </div>

      {blockToDelete && (
        <ConfirmDialog
          cancelLabel={t("cancel")}
          confirmLabel={t("delete")}
          isDanger
          message={`${t("deletePageBlockConfirm")} ${blockToDelete.title || blockToDelete.blockType}?`}
          onCancel={() => setBlockToDelete(null)}
          onConfirm={() => void handleDelete(blockToDelete)}
          title={t("confirmDelete")}
        />
      )}
    </section>
  );
}
