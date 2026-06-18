import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router";
import { ApiError } from "../api/httpClient";
import * as pageApi from "../api/pageApi";
import * as pageBlockApi from "../api/pageBlockApi";
import ButtonLabel from "../components/ui/ButtonLabel";
import type { Page } from "../models/page";
import { usePreferences } from "../preferences/PreferencesContext";

type PageBlockFormState = {
  title: string;
  blockType: string;
  sortOrder: string;
  visible: boolean;
  configJson: string;
};

const emptyForm: PageBlockFormState = {
  title: "",
  blockType: "",
  sortOrder: "0",
  visible: true,
  configJson: "",
};

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

export default function PageBlockFormPage() {
  const navigate = useNavigate();
  const { t } = usePreferences();
  const { id, blockId } = useParams();
  const pageId = id === undefined ? null : Number(id);
  const editedBlockId = blockId === undefined ? null : Number(blockId);
  const isEditMode = editedBlockId !== null;
  const hasInvalidId =
    pageId === null ||
    !Number.isInteger(pageId) ||
    pageId <= 0 ||
    (blockId !== undefined &&
      (editedBlockId === null ||
        !Number.isInteger(editedBlockId) ||
        editedBlockId <= 0));
  const [page, setPage] = useState<Page | null>(null);
  const [form, setForm] = useState<PageBlockFormState>(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (hasInvalidId || !pageId) {
      return;
    }

    async function loadData() {
      setIsLoading(true);
      setError("");

      try {
        const [loadedPage, block] = await Promise.all([
          pageApi.getPage(pageId as number),
          editedBlockId
            ? pageBlockApi.getBlock(editedBlockId)
            : Promise.resolve(null),
        ]);
        setPage(loadedPage);

        if (block) {
          if (block.pageId !== pageId) {
            setError(t("pageBlockBelongsToAnotherPage"));
            return;
          }

          setForm({
            title: block.title ?? "",
            blockType: block.blockType,
            sortOrder: String(block.sortOrder),
            visible: block.visible,
            configJson: block.configJson ?? "",
          });
        }
      } catch (caughtError) {
        setError(getErrorMessage(caughtError, t("pageBlockCouldNotBeLoaded")));
      } finally {
        setIsLoading(false);
      }
    }

    void loadData();
  }, [editedBlockId, hasInvalidId, pageId, t]);

  if (hasInvalidId) {
    return <Navigate replace to="/pages" />;
  }

  const validPageId = pageId as number;

  function updateForm<K extends keyof PageBlockFormState>(
    key: K,
    value: PageBlockFormState[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const input = {
        pageId: validPageId,
        title: form.title.trim() || null,
        blockType: form.blockType.trim(),
        sortOrder: Number(form.sortOrder),
        visible: form.visible,
        configJson: form.configJson.trim() || null,
      };

      if (editedBlockId) {
        await pageBlockApi.updateBlock(editedBlockId, input);
      } else {
        await pageBlockApi.createBlock(input);
      }

      navigate(`/pages/${validPageId}/blocks`);
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, t("pageBlockCouldNotBeSaved")));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="users-page">
      <div className="page-heading">
        <div>
          <h2>{isEditMode ? t("editPageBlock") : t("createPageBlock")}</h2>
          <p>
            {page
              ? `${t("pageBlockFor")} ${page.title}`
              : t("managePageBlockDetails")}
          </p>
        </div>
        <Link className="secondary-link" to={`/pages/${validPageId}/blocks`}>
          <ButtonLabel icon="back">{t("backToPageBlocks")}</ButtonLabel>
        </Link>
      </div>

      <form className="user-form page-block-form" onSubmit={handleSubmit}>
        {isLoading ? (
          <div className="inline-status">{t("loadingPageBlock")}</div>
        ) : (
          <>
            {error && <div className="error-message">{error}</div>}

            <div className="page-block-form__row">
              <label>
                {t("title")}
                <input
                  name="title"
                  onChange={(event) => updateForm("title", event.target.value)}
                  type="text"
                  value={form.title}
                />
              </label>

              <label>
                {t("blockType")}
                <input
                  name="blockType"
                  onChange={(event) => updateForm("blockType", event.target.value)}
                  required
                  type="text"
                  value={form.blockType}
                />
              </label>

              <label>
                {t("sortOrder")}
                <input
                  name="sortOrder"
                  onChange={(event) => updateForm("sortOrder", event.target.value)}
                  required
                  step="1"
                  type="number"
                  value={form.sortOrder}
                />
              </label>

              <label className="checkbox-field page-block-form__checkbox">
                <input
                  checked={form.visible}
                  name="visible"
                  onChange={(event) => updateForm("visible", event.target.checked)}
                  type="checkbox"
                />
                {t("visible")}
              </label>
            </div>

            <label>
              {t("configJson")}
              <textarea
                name="configJson"
                onChange={(event) => updateForm("configJson", event.target.value)}
                placeholder={'{\n  "headline": "Welcome"\n}'}
                rows={16}
                value={form.configJson}
              />
            </label>

            <div className="form-actions">
              <button disabled={isSubmitting} type="submit">
                <ButtonLabel icon={isEditMode ? "save" : "create"}>
                  {isSubmitting
                    ? t("saving")
                    : isEditMode
                      ? t("saveChanges")
                      : t("createPageBlock")}
                </ButtonLabel>
              </button>
              <Link className="secondary-link" to={`/pages/${validPageId}/blocks`}>
                <ButtonLabel icon="cancel">{t("cancel")}</ButtonLabel>
              </Link>
            </div>
          </>
        )}
      </form>
    </section>
  );
}
