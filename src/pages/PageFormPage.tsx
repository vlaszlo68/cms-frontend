import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router";
import { ApiError } from "../api/httpClient";
import * as pageApi from "../api/pageApi";
import ButtonLabel from "../components/ui/ButtonLabel";
import type { CreatePageRequest, Page, PageStatus, UpdatePageRequest } from "../models/page";
import { usePreferences } from "../preferences/PreferencesContext";

const pageStatuses: PageStatus[] = ["DRAFT", "PUBLISHED", "ARCHIVED"];

type PageFormState = {
  title: string;
  slug: string;
  content: string;
  status: PageStatus;
  metaTitle: string;
  metaDescription: string;
  homepage: boolean;
  menuVisible: boolean;
};

const emptyForm: PageFormState = {
  title: "",
  slug: "",
  content: "",
  status: "DRAFT",
  metaTitle: "",
  metaDescription: "",
  homepage: false,
  menuVisible: true,
};

function toFormState(page: Page): PageFormState {
  return {
    title: page.title,
    slug: page.slug,
    content: page.content,
    status: page.status,
    metaTitle: page.metaTitle,
    metaDescription: page.metaDescription,
    homepage: page.homepage,
    menuVisible: page.menuVisible,
  };
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

export default function PageFormPage() {
  const navigate = useNavigate();
  const { t } = usePreferences();
  const { id } = useParams();
  const editedPageId = id === undefined ? null : Number(id);
  const isEditMode = editedPageId !== null;
  const [form, setForm] = useState<PageFormState>(emptyForm);
  const [isPageLoading, setIsPageLoading] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const hasInvalidPageId =
    id !== undefined &&
    (editedPageId === null || !Number.isInteger(editedPageId) || editedPageId <= 0);

  useEffect(() => {
    if (!editedPageId) {
      return;
    }

    async function loadPage(pageId: number) {
      setIsPageLoading(true);
      setError("");

      try {
        const page = await pageApi.getPage(pageId);
        setForm(toFormState(page));
      } catch (caughtError) {
        setError(getErrorMessage(caughtError, t("pageCouldNotBeLoaded")));
      } finally {
        setIsPageLoading(false);
      }
    }

    void loadPage(editedPageId);
  }, [editedPageId, t]);

  if (hasInvalidPageId) {
    return <Navigate to="/pages" replace />;
  }

  function updateForm<K extends keyof PageFormState>(key: K, value: PageFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const title = form.title.trim();
    const slug = form.slug.trim();

    if (!title) {
      setError(t("titleRequired"));
      return;
    }

    if (!slug) {
      setError(t("slugRequired"));
      return;
    }

    setIsSubmitting(true);

    try {
      const input: CreatePageRequest | UpdatePageRequest = {
        title,
        slug,
        content: form.content,
        status: form.status,
        metaTitle: form.metaTitle.trim(),
        metaDescription: form.metaDescription.trim(),
        homepage: form.homepage,
        menuVisible: form.menuVisible,
      };

      if (editedPageId) {
        await pageApi.updatePage(editedPageId, input);
      } else {
        await pageApi.createPage(input);
      }

      navigate("/pages");
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, t("pageCouldNotBeSaved")));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="users-page">
      <div className="page-heading">
        <div>
          <h2>{isEditMode ? t("editPage") : t("createPage")}</h2>
          <p>{isEditMode ? t("updatePage") : t("addCmsPage")}</p>
        </div>
        <Link className="secondary-link" to="/pages">
          <ButtonLabel icon="back">{t("backToPages")}</ButtonLabel>
        </Link>
      </div>

      <form className="user-form page-form" onSubmit={handleSubmit}>
        {isPageLoading ? (
          <div className="inline-status">{t("loadingPage")}</div>
        ) : (
          <>
            {error && <div className="error-message">{error}</div>}

            <div className="page-form__row page-form__row--main">
              <label>
                {t("title")}
                <input
                  name="title"
                  onChange={(event) => updateForm("title", event.target.value)}
                  required
                  type="text"
                  value={form.title}
                />
              </label>

              <label>
                {t("slug")}
                <input
                  name="slug"
                  onChange={(event) => updateForm("slug", event.target.value)}
                  required
                  type="text"
                  value={form.slug}
                />
              </label>

              <label>
                {t("status")}
                <select
                  name="status"
                  onChange={(event) => updateForm("status", event.target.value as PageStatus)}
                  required
                  value={form.status}
                >
                  {pageStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="page-form__row page-form__row--meta">
              <label>
                {t("metaTitle")}
                <input
                  name="metaTitle"
                  onChange={(event) => updateForm("metaTitle", event.target.value)}
                  type="text"
                  value={form.metaTitle}
                />
              </label>

              <label>
                {t("metaDescription")}
                <input
                  name="metaDescription"
                  onChange={(event) => updateForm("metaDescription", event.target.value)}
                  type="text"
                  value={form.metaDescription}
                />
              </label>

              <label className="checkbox-field page-form__checkbox">
                <input
                  checked={form.homepage}
                  name="homepage"
                  onChange={(event) => updateForm("homepage", event.target.checked)}
                  type="checkbox"
                />
                {t("homepage")}
              </label>

              <label className="checkbox-field page-form__checkbox">
                <input
                  checked={form.menuVisible}
                  name="menuVisible"
                  onChange={(event) => updateForm("menuVisible", event.target.checked)}
                  type="checkbox"
                />
                {t("menuVisible")}
              </label>
            </div>

            <label>
              {t("content")}
              <textarea
                name="content"
                onChange={(event) => updateForm("content", event.target.value)}
                rows={16}
                value={form.content}
              />
            </label>

            <div className="form-actions">
              <button disabled={isSubmitting} type="submit">
                <ButtonLabel icon={isEditMode ? "save" : "create"}>
                  {isSubmitting ? t("saving") : isEditMode ? t("saveChanges") : t("createPage")}
                </ButtonLabel>
              </button>
              <Link className="secondary-link" to="/pages">
                <ButtonLabel icon="cancel">{t("cancel")}</ButtonLabel>
              </Link>
            </div>
          </>
        )}
      </form>
    </section>
  );
}
