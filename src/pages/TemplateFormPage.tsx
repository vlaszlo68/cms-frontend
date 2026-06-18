import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router";
import { ApiError } from "../api/httpClient";
import * as mediaApi from "../api/mediaApi";
import * as templateApi from "../api/templateApi";
import ButtonLabel from "../components/ui/ButtonLabel";
import type { Media } from "../models/media";
import { usePreferences } from "../preferences/PreferencesContext";

type TemplateFormState = {
  code: string;
  name: string;
  description: string;
  previewImageMediaId: string;
  active: boolean;
};

const emptyForm: TemplateFormState = {
  code: "",
  name: "",
  description: "",
  previewImageMediaId: "",
  active: true,
};

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

export default function TemplateFormPage() {
  const navigate = useNavigate();
  const { t } = usePreferences();
  const { id } = useParams();
  const editedTemplateId = id === undefined ? null : Number(id);
  const isEditMode = editedTemplateId !== null;
  const hasInvalidId =
    id !== undefined &&
    (editedTemplateId === null ||
      !Number.isInteger(editedTemplateId) ||
      editedTemplateId <= 0);
  const [form, setForm] = useState<TemplateFormState>(emptyForm);
  const [media, setMedia] = useState<Media[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setError("");

      try {
        const [loadedMedia, template] = await Promise.all([
          mediaApi.getMediaList(),
          editedTemplateId ? templateApi.getTemplate(editedTemplateId) : Promise.resolve(null),
        ]);
        setMedia(loadedMedia);

        if (template) {
          setForm({
            code: template.code,
            name: template.name,
            description: template.description ?? "",
            previewImageMediaId:
              template.previewImageMediaId == null
                ? ""
                : String(template.previewImageMediaId),
            active: template.active,
          });
        }
      } catch (caughtError) {
        setError(getErrorMessage(caughtError, t("templateCouldNotBeLoaded")));
      } finally {
        setIsLoading(false);
      }
    }

    void loadData();
  }, [editedTemplateId, t]);

  if (hasInvalidId) {
    return <Navigate replace to="/templates" />;
  }

  function updateForm<K extends keyof TemplateFormState>(
    key: K,
    value: TemplateFormState[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const input = {
        code: form.code.trim(),
        name: form.name.trim(),
        description: form.description.trim() || null,
        previewImageMediaId: form.previewImageMediaId
          ? Number(form.previewImageMediaId)
          : null,
        active: form.active,
      };

      if (editedTemplateId) {
        await templateApi.updateTemplate(editedTemplateId, input);
      } else {
        await templateApi.createTemplate(input);
      }

      navigate("/templates");
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, t("templateCouldNotBeSaved")));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="users-page">
      <div className="page-heading">
        <div>
          <h2>{isEditMode ? t("editTemplate") : t("createTemplate")}</h2>
          <p>{isEditMode ? t("updateTemplate") : t("addCmsTemplate")}</p>
        </div>
        <Link className="secondary-link" to="/templates">
          <ButtonLabel icon="back">{t("backToTemplates")}</ButtonLabel>
        </Link>
      </div>

      <form className="user-form user-form--page" onSubmit={handleSubmit}>
        {isLoading ? (
          <div className="inline-status">{t("loadingTemplate")}</div>
        ) : (
          <>
            {error && <div className="error-message">{error}</div>}

            <label>
              {t("code")}
              <input
                name="code"
                onChange={(event) => updateForm("code", event.target.value)}
                required
                type="text"
                value={form.code}
              />
            </label>

            <label>
              {t("name")}
              <input
                name="name"
                onChange={(event) => updateForm("name", event.target.value)}
                required
                type="text"
                value={form.name}
              />
            </label>

            <label>
              {t("description")}
              <textarea
                name="description"
                onChange={(event) => updateForm("description", event.target.value)}
                rows={4}
                value={form.description}
              />
            </label>

            <label>
              {t("previewImage")}
              <select
                name="previewImageMediaId"
                onChange={(event) => updateForm("previewImageMediaId", event.target.value)}
                value={form.previewImageMediaId}
              >
                <option value="">{t("noMediaSelected")}</option>
                {media.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.originalFileName}
                  </option>
                ))}
              </select>
            </label>

            <label className="checkbox-field">
              <input
                checked={form.active}
                name="active"
                onChange={(event) => updateForm("active", event.target.checked)}
                type="checkbox"
              />
              {t("active")}
            </label>

            <div className="form-actions">
              <button disabled={isSubmitting} type="submit">
                <ButtonLabel icon={isEditMode ? "save" : "create"}>
                  {isSubmitting
                    ? t("saving")
                    : isEditMode
                      ? t("saveChanges")
                      : t("createTemplate")}
                </ButtonLabel>
              </button>
              <Link className="secondary-link" to="/templates">
                <ButtonLabel icon="cancel">{t("cancel")}</ButtonLabel>
              </Link>
            </div>
          </>
        )}
      </form>
    </section>
  );
}
