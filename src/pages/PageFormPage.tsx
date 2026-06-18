import type { FormEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router";
import { ApiError } from "../api/httpClient";
import * as pageApi from "../api/pageApi";
import * as templateApi from "../api/templateApi";
import ButtonLabel from "../components/ui/ButtonLabel";
import type {
  CreatePageRequest,
  Page,
  PageStatus,
  PageType,
  UpdatePageRequest,
} from "../models/page";
import type { Template } from "../models/template";
import { usePreferences } from "../preferences/PreferencesContext";

const pageStatuses: PageStatus[] = ["DRAFT", "PUBLISHED", "ARCHIVED"];
const pageTypes: PageType[] = ["CONTENT", "BLOCK"];
const removableTags = new Set(["script", "style", "iframe", "object", "embed", "form"]);
const allowedTags = new Set([
  "a",
  "b",
  "blockquote",
  "br",
  "code",
  "div",
  "em",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "hr",
  "i",
  "img",
  "li",
  "ol",
  "p",
  "pre",
  "s",
  "span",
  "strong",
  "table",
  "tbody",
  "td",
  "th",
  "thead",
  "tr",
  "u",
  "ul",
]);
const allowedAttributes = new Map<string, Set<string>>([
  ["a", new Set(["href", "target", "title"])],
  ["img", new Set(["alt", "src", "title"])],
  ["td", new Set(["colspan", "rowspan"])],
  ["th", new Set(["colspan", "rowspan"])],
]);

type PageFormState = {
  title: string;
  slug: string;
  content: string;
  status: PageStatus;
  metaTitle: string;
  metaDescription: string;
  homepage: boolean;
  menuVisible: boolean;
  templateCode: string;
  pageType: PageType;
};

type PreviewMode = "off" | "horizontal" | "vertical";

const emptyForm: PageFormState = {
  title: "",
  slug: "",
  content: "",
  status: "DRAFT",
  metaTitle: "",
  metaDescription: "",
  homepage: false,
  menuVisible: true,
  templateCode: "STANDARD",
  pageType: "CONTENT",
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
    templateCode: page.templateCode || "STANDARD",
    pageType: page.pageType || "CONTENT",
  };
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

function escapeHtmlAttribute(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("\"", "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function isSafeUrl(value: string, allowImages = false) {
  const trimmedValue = value.trim().toLowerCase();

  if (trimmedValue.startsWith("#")) {
    return true;
  }

  if (
    trimmedValue.startsWith("http://") ||
    trimmedValue.startsWith("https://") ||
    trimmedValue.startsWith("mailto:") ||
    trimmedValue.startsWith("tel:")
  ) {
    return true;
  }

  return allowImages && trimmedValue.startsWith("data:image/");
}

function sanitizeHtml(input: string) {
  if (!input.trim()) {
    return "";
  }

  const document = new DOMParser().parseFromString(input, "text/html");

  function sanitizeNode(node: Node) {
    if (node.nodeType === Node.COMMENT_NODE) {
      node.parentNode?.removeChild(node);
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return;
    }

    const element = node as Element;
    const tagName = element.tagName.toLowerCase();

    if (removableTags.has(tagName)) {
      element.remove();
      return;
    }

    if (!allowedTags.has(tagName)) {
      element.replaceWith(...Array.from(element.childNodes));
      return;
    }

    const tagAttributes = allowedAttributes.get(tagName) ?? new Set<string>();

    for (const attribute of Array.from(element.attributes)) {
      const attributeName = attribute.name.toLowerCase();
      const attributeValue = attribute.value;

      if (attributeName.startsWith("on") || attributeName === "style") {
        element.removeAttribute(attribute.name);
        continue;
      }

      if (!tagAttributes.has(attributeName)) {
        element.removeAttribute(attribute.name);
        continue;
      }

      if (
        (attributeName === "href" && !isSafeUrl(attributeValue)) ||
        (attributeName === "src" && !isSafeUrl(attributeValue, true))
      ) {
        element.removeAttribute(attribute.name);
      }
    }

    if (tagName === "a" && element.getAttribute("target") === "_blank") {
      element.setAttribute("rel", "noopener noreferrer");
    }
  }

  const comments = document.createTreeWalker(document.body, NodeFilter.SHOW_COMMENT);
  const commentsToRemove: Node[] = [];
  let comment = comments.nextNode();

  while (comment) {
    commentsToRemove.push(comment);
    comment = comments.nextNode();
  }

  commentsToRemove.forEach((node) => node.parentNode?.removeChild(node));
  document.body.querySelectorAll("*").forEach(sanitizeNode);

  return document.body.innerHTML;
}

export default function PageFormPage() {
  const navigate = useNavigate();
  const { t } = usePreferences();
  const { id } = useParams();
  const editedPageId = id === undefined ? null : Number(id);
  const isEditMode = editedPageId !== null;
  const [form, setForm] = useState<PageFormState>(emptyForm);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [previewMode, setPreviewMode] = useState<PreviewMode>("off");
  const contentTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const sanitizedPreview = useMemo(() => sanitizeHtml(form.content), [form.content]);
  const hasInvalidPageId =
    id !== undefined &&
    (editedPageId === null || !Number.isInteger(editedPageId) || editedPageId <= 0);

  useEffect(() => {
    if (hasInvalidPageId) {
      return;
    }

    async function loadData() {
      setIsPageLoading(true);
      setError("");

      try {
        const [loadedTemplates, page] = await Promise.all([
          templateApi.getTemplates(),
          editedPageId ? pageApi.getPage(editedPageId) : Promise.resolve(null),
        ]);
        setTemplates(loadedTemplates);

        if (page) {
          setForm(toFormState(page));
        }
      } catch (caughtError) {
        setError(getErrorMessage(caughtError, t("pageCouldNotBeLoaded")));
      } finally {
        setIsPageLoading(false);
      }
    }

    void loadData();
  }, [editedPageId, hasInvalidPageId, t]);

  if (hasInvalidPageId) {
    return <Navigate to="/pages" replace />;
  }

  function updateForm<K extends keyof PageFormState>(key: K, value: PageFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function replaceSelectedContent(nextValue: string, selectionStart: number, selectionEnd: number) {
    updateForm("content", nextValue);

    window.setTimeout(() => {
      contentTextareaRef.current?.focus();
      contentTextareaRef.current?.setSelectionRange(selectionStart, selectionEnd);
    }, 0);
  }

  function insertContentSnippet(before: string, after: string, fallback: string) {
    const textarea = contentTextareaRef.current;

    if (!textarea) {
      return;
    }

    const selectionStart = textarea.selectionStart;
    const selectionEnd = textarea.selectionEnd;
    const selectedText = form.content.slice(selectionStart, selectionEnd) || fallback;
    const insertedText = `${before}${selectedText}${after}`;
    const nextValue =
      form.content.slice(0, selectionStart) + insertedText + form.content.slice(selectionEnd);

    replaceSelectedContent(
      nextValue,
      selectionStart + before.length,
      selectionStart + before.length + selectedText.length,
    );
  }

  function insertContentBlock(tagName: string, fallback: string) {
    insertContentSnippet(`<${tagName}>`, `</${tagName}>`, fallback);
  }

  function insertList() {
    const textarea = contentTextareaRef.current;

    if (!textarea) {
      return;
    }

    const selectionStart = textarea.selectionStart;
    const selectionEnd = textarea.selectionEnd;
    const selectedText = form.content.slice(selectionStart, selectionEnd);
    const listItems = (selectedText || t("listItem"))
      .split(/\r?\n/)
      .filter((line) => line.trim().length > 0)
      .map((line) => `  <li>${line.trim()}</li>`)
      .join("\n");
    const insertedText = `<ul>\n${listItems}\n</ul>`;
    const nextValue =
      form.content.slice(0, selectionStart) + insertedText + form.content.slice(selectionEnd);

    replaceSelectedContent(nextValue, selectionStart, selectionStart + insertedText.length);
  }

  function insertLink() {
    const href = window.prompt(t("linkUrlPrompt"), "https://");

    if (!href) {
      return;
    }

    insertContentSnippet(`<a href="${escapeHtmlAttribute(href)}">`, "</a>", t("linkText"));
  }

  function insertImage() {
    const src = window.prompt(t("imageUrlPrompt"), "https://");

    if (!src) {
      return;
    }

    const alt = window.prompt(t("imageAltPrompt"), "") ?? "";
    insertContentSnippet(
      `<img src="${escapeHtmlAttribute(src)}" alt="${escapeHtmlAttribute(alt)}">`,
      "",
      "",
    );
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
        content: form.pageType === "CONTENT" ? form.content : "",
        status: form.status,
        metaTitle: form.metaTitle.trim(),
        metaDescription: form.metaDescription.trim(),
        homepage: form.homepage,
        menuVisible: form.menuVisible,
        templateCode: form.templateCode,
        pageType: form.pageType,
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

              <label>
                {t("template")}
                <select
                  name="templateCode"
                  onChange={(event) => updateForm("templateCode", event.target.value)}
                  required
                  value={form.templateCode}
                >
                  {!templates.some((template) => template.code === form.templateCode) && (
                    <option value={form.templateCode}>{form.templateCode}</option>
                  )}
                  {templates.map((template) => (
                    <option key={template.id} value={template.code}>
                      {template.name} ({template.code})
                    </option>
                  ))}
                </select>
              </label>

              <label>
                {t("pageType")}
                <select
                  name="pageType"
                  onChange={(event) =>
                    updateForm("pageType", event.target.value as PageType)
                  }
                  required
                  value={form.pageType}
                >
                  {pageTypes.map((pageType) => (
                    <option key={pageType} value={pageType}>
                      {pageType}
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

            {form.pageType === "CONTENT" ? (
              <div className={`page-content-editor page-content-editor--${previewMode}`}>
                <div className="page-content-field">
                  <label htmlFor="page-content">{t("content")}</label>
                  <div className="editor-toolbar" aria-label={t("editorToolbar")}>
                  <button onClick={() => insertContentBlock("p", t("paragraphText"))} type="button">
                    P
                  </button>
                  <button onClick={() => insertContentBlock("h1", t("headingText"))} type="button">
                    H1
                  </button>
                  <button onClick={() => insertContentBlock("h2", t("headingText"))} type="button">
                    H2
                  </button>
                  <button onClick={() => insertContentBlock("h3", t("headingText"))} type="button">
                    H3
                  </button>
                  <button onClick={() => insertContentBlock("h4", t("headingText"))} type="button">
                    H4
                  </button>
                  <button onClick={() => insertContentBlock("h5", t("headingText"))} type="button">
                    H5
                  </button>
                  <button onClick={() => insertContentBlock("h6", t("headingText"))} type="button">
                    H6
                  </button>
                  <button onClick={() => insertContentSnippet("<strong>", "</strong>", t("boldText"))} type="button">
                    B
                  </button>
                  <button onClick={() => insertContentSnippet("<em>", "</em>", t("italicText"))} type="button">
                    I
                  </button>
                  <button onClick={insertLink} type="button">
                    {t("link")}
                  </button>
                  <button onClick={insertList} type="button">
                    {t("list")}
                  </button>
                  <button onClick={() => insertContentBlock("blockquote", t("quoteText"))} type="button">
                    {t("quote")}
                  </button>
                  <button onClick={() => insertContentBlock("span", t("spanText"))} type="button">
                    Span
                  </button>
                  <button onClick={() => insertContentBlock("div", t("divText"))} type="button">
                    Div
                  </button>
                  <button onClick={insertImage} type="button">
                    {t("image")}
                  </button>
                  </div>
                  <textarea
                    id="page-content"
                    ref={contentTextareaRef}
                    name="content"
                    onChange={(event) => updateForm("content", event.target.value)}
                    rows={16}
                    value={form.content}
                  />
                </div>

                {previewMode !== "off" && (
                  <section className="page-content-preview-field">
                    <h3>{t("preview")}</h3>
                    <div className="page-content-preview" aria-label={t("preview")}>
                      {sanitizedPreview ? (
                        <div
                          className="page-content-preview__body"
                          dangerouslySetInnerHTML={{ __html: sanitizedPreview }}
                        />
                      ) : (
                        <div className="inline-status">{t("noPreviewContent")}</div>
                      )}
                    </div>
                  </section>
                )}
              </div>
            ) : (
              <div className="inline-status page-block-mode-info">
                {t("blockPageContentInfo")}
              </div>
            )}

            <div className="form-actions">
              <button disabled={isSubmitting} type="submit">
                <ButtonLabel icon={isEditMode ? "save" : "create"}>
                  {isSubmitting ? t("saving") : isEditMode ? t("saveChanges") : t("createPage")}
                </ButtonLabel>
              </button>
              <Link className="secondary-link" to="/pages">
                <ButtonLabel icon="cancel">{t("cancel")}</ButtonLabel>
              </Link>
              {form.pageType === "CONTENT" && (
                <label className="page-preview-mode">
                  {t("previewMode")}
                  <select
                    onChange={(event) => setPreviewMode(event.target.value as PreviewMode)}
                    value={previewMode}
                  >
                    <option value="off">{t("previewOff")}</option>
                    <option value="horizontal">{t("previewHorizontal")}</option>
                    <option value="vertical">{t("previewVertical")}</option>
                  </select>
                </label>
              )}
            </div>
          </>
        )}
      </form>
    </section>
  );
}
