import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router";
import { ApiError } from "../api/httpClient";
import * as pageApi from "../api/pageApi";
import * as pageBlockApi from "../api/pageBlockApi";
import { getCollections } from "../api/contentApi";
import ButtonLabel from "../components/ui/ButtonLabel";
import type { Page } from "../models/page";
import { usePreferences } from "../preferences/PreferencesContext";
import { useSiteContext } from "../sites/SiteContext";
import { parseContentCollectionBlockConfig, type ContentCollectionBlockConfig } from "../models/pageBlock";
import type { ContentCollection } from "../models/content";

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
  const { selectedSite } = useSiteContext();
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
  const [collections, setCollections] = useState<ContentCollection[]>([]);
  const [collectionConfig, setCollectionConfig] = useState<ContentCollectionBlockConfig>(parseContentCollectionBlockConfig());
  const [collectionLoadError, setCollectionLoadError] = useState("");

  useEffect(() => {
    if (hasInvalidId || !pageId) {
      return;
    }

    async function loadData() {
      setIsLoading(true);
      setError("");
      setCollectionLoadError("");

      try {
        const [loadedPage, block, loadedCollections] = await Promise.all([
          pageApi.getPage(selectedSite!.code, pageId as number),
          editedBlockId
            ? pageBlockApi.getBlock(selectedSite!.code, pageId as number, editedBlockId)
            : Promise.resolve(null),
          getCollections(selectedSite!.code),
        ]);
        setPage(loadedPage);
        setCollections(loadedCollections);

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
          if (block.blockType === "CONTENT_COLLECTION") setCollectionConfig(parseContentCollectionBlockConfig(block.configJson));
        }
      } catch (caughtError) {
        const message = getErrorMessage(caughtError, t("pageBlockCouldNotBeLoaded"));
        setError(message);
        setCollectionLoadError(message);
      } finally {
        setIsLoading(false);
      }
    }

    void loadData();
  }, [editedBlockId, hasInvalidId, pageId, selectedSite?.code, t]);

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
    if (form.blockType === "CONTENT_COLLECTION" && !collectionConfig.collectionCode.trim()) {
      setError("Select a collection before saving this block.");
      return;
    }
    setIsSubmitting(true);

    try {
      const input = {
        pageId: validPageId,
        title: form.title.trim() || null,
        blockType: form.blockType.trim(),
        sortOrder: Number(form.sortOrder),
        visible: form.visible,
        configJson: form.blockType === "CONTENT_COLLECTION"
          ? JSON.stringify({ ...collectionConfig, collectionCode: collectionConfig.collectionCode.trim().toUpperCase() })
          : form.configJson.trim() || null,
      };

      if (editedBlockId) {
        if (!selectedSite) return;
        await pageBlockApi.updateBlock(selectedSite.code, validPageId, editedBlockId, input);
      } else {
        if (!selectedSite) return;
        await pageBlockApi.createBlock(selectedSite.code, validPageId, input);
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
                  list="page-block-types"
                  onChange={(event) => updateForm("blockType", event.target.value)}
                  required
                  type="text"
                  value={form.blockType}
                />
                <datalist id="page-block-types">
                  <option value="HERO" />
                  <option value="TEXT" />
                  <option value="CTA" />
                  <option value="CONTENT_COLLECTION" />
                </datalist>
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

            {form.blockType === "CONTENT_COLLECTION" ? <fieldset><legend>Content collection</legend>
              {collectionLoadError && <div className="error-message">Collections could not be loaded: {collectionLoadError}</div>}
              <label>Collection
                <select required value={collectionConfig.collectionCode} onChange={(event) => setCollectionConfig((current) => ({ ...current, collectionCode: event.target.value }))}>
                  <option value="">Select a collection</option>
                  {collections.map((collection) => <option key={collection.id} value={collection.code}>{collection.name} ({collection.code}) — {collection.contentType} — {collection.active ? "active" : "inactive"}</option>)}
                </select>
              </label>
              {collectionConfig.collectionCode && !collections.some((collection) => collection.code === collectionConfig.collectionCode) && <div className="error-message">The saved collection is no longer available for this Site. Select another collection.</div>}
              {!collections.find((collection) => collection.code === collectionConfig.collectionCode)?.active && collectionConfig.collectionCode && <p className="form-help">Inactive collections remain editable but are unavailable publicly.</p>}
              <label>Display mode<select value={collectionConfig.displayMode} onChange={(event) => setCollectionConfig((current) => ({ ...current, displayMode: event.target.value as ContentCollectionBlockConfig["displayMode"] }))}><option value="CARDS">Cards</option><option value="COMPACT_LIST">Compact list</option></select></label>
              <label className="checkbox-field"><input checked={collectionConfig.paginationEnabled} type="checkbox" onChange={(event) => setCollectionConfig((current) => ({ ...current, paginationEnabled: event.target.checked }))} />Enable pagination</label>
            </fieldset> : <label>
              {t("configJson")}
              <textarea
                name="configJson"
                onChange={(event) => updateForm("configJson", event.target.value)}
                placeholder={'{\n  "headline": "Welcome"\n}'}
                rows={16}
                value={form.configJson}
              />
            </label>}

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
