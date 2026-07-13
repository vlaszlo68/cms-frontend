import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { ApiError } from "../api/httpClient";
import * as templateApi from "../api/templateApi";
import ButtonLabel from "../components/ui/ButtonLabel";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import type { Template } from "../models/template";
import { usePreferences } from "../preferences/PreferencesContext";

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

export default function TemplatesPage() {
  const { tablePageSize, t } = usePreferences();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [templateToDelete, setTemplateToDelete] = useState<Template | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const sortedTemplates = useMemo(
    () => [...templates].sort((left, right) => left.code.localeCompare(right.code)),
    [templates],
  );
  const totalPages = Math.max(1, Math.ceil(sortedTemplates.length / tablePageSize));
  const paginatedTemplates = useMemo(
    () =>
      sortedTemplates.slice(
        (currentPage - 1) * tablePageSize,
        currentPage * tablePageSize,
      ),
    [currentPage, sortedTemplates, tablePageSize],
  );

  async function loadTemplates() {
    setIsLoading(true);
    setError("");

    try {
      setTemplates(await templateApi.getTemplates());
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, t("templatesCouldNotBeLoaded")));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadTemplates();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [tablePageSize]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  async function handleDelete(template: Template) {
    setError("");
    setPendingDeleteId(template.id);

    try {
      await templateApi.deleteTemplate(template.id);
      setTemplates((current) => current.filter((item) => item.id !== template.id));
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, t("templateCouldNotBeDeleted")));
    } finally {
      setPendingDeleteId(null);
      setTemplateToDelete(null);
    }
  }

  return (
    <section className="users-page">
      <div className="page-heading">
        <div>
          <h2>{t("templates")}</h2>
          <p>{t("manageTemplates")}</p>
        </div>
        <div className="page-actions">
          <button className="secondary-button" onClick={() => void loadTemplates()} type="button">
            <ButtonLabel icon="refresh">{t("refresh")}</ButtonLabel>
          </button>
          <Link className="button-link" to="/templates/new">
            <ButtonLabel icon="create">{t("newTemplate")}</ButtonLabel>
          </Link>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="users-table-wrap">
        {isLoading ? (
          <div className="inline-status">{t("loadingTemplates")}</div>
        ) : sortedTemplates.length === 0 ? (
          <div className="inline-status">{t("noTemplates")}</div>
        ) : (
          <>
            <table className="users-table users-table--templates">
              <thead>
                <tr>
                  <th>{t("code")}</th>
                  <th>{t("name")}</th>
                  <th>{t("description")}</th>
                  <th>{t("active")}</th>
                  <th>{t("actions")}</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTemplates.map((template) => (
                  <tr key={template.id}>
                    <td>{template.code}</td>
                    <td>{template.name}</td>
                    <td>{template.description || "-"}</td>
                    <td>{template.active ? t("yes") : t("no")}</td>
                    <td>
                      <div className="table-actions">
                        <Link className="secondary-link" to={`/templates/${template.id}/edit`}>
                          <ButtonLabel icon="edit">{t("edit")}</ButtonLabel>
                        </Link>
                        <button
                          className="danger-button"
                          disabled={pendingDeleteId === template.id}
                          onClick={() => setTemplateToDelete(template)}
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

      {templateToDelete && (
        <ConfirmDialog
          cancelLabel={t("cancel")}
          confirmLabel={t("delete")}
          isDanger
          message={`${t("deleteTemplateConfirm")} ${templateToDelete.name}?`}
          onCancel={() => setTemplateToDelete(null)}
          onConfirm={() => void handleDelete(templateToDelete)}
          title={t("confirmDelete")}
        />
      )}
    </section>
  );
}
