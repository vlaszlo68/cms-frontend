import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { ApiError } from "../api/httpClient";
import * as mediaApi from "../api/mediaApi";
import * as siteSettingsApi from "../api/siteSettingsApi";
import ButtonLabel from "../components/ui/ButtonLabel";
import type { Media } from "../models/media";
import { usePreferences } from "../preferences/PreferencesContext";

type SiteSettingsFormState = {
  siteName: string;
  logoMediaId: string;
  footerText: string;
  contactEmail: string;
  phone: string;
  facebookUrl: string;
  linkedinUrl: string;
};

const emptyForm: SiteSettingsFormState = {
  siteName: "",
  logoMediaId: "",
  footerText: "",
  contactEmail: "",
  phone: "",
  facebookUrl: "",
  linkedinUrl: "",
};

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

function nullable(value: string) {
  return value.trim() || null;
}

export default function SiteSettingsPage() {
  const { t } = usePreferences();
  const [form, setForm] = useState<SiteSettingsFormState>(emptyForm);
  const [media, setMedia] = useState<Media[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setError("");

      try {
        const [settings, loadedMedia] = await Promise.all([
          siteSettingsApi.getSettings(),
          mediaApi.getMediaList(),
        ]);
        setMedia(loadedMedia);
        setForm({
          siteName: settings.siteName,
          logoMediaId:
            settings.logoMediaId == null ? "" : String(settings.logoMediaId),
          footerText: settings.footerText ?? "",
          contactEmail: settings.contactEmail ?? "",
          phone: settings.phone ?? "",
          facebookUrl: settings.facebookUrl ?? "",
          linkedinUrl: settings.linkedinUrl ?? "",
        });
      } catch (caughtError) {
        setError(getErrorMessage(caughtError, t("siteSettingsCouldNotBeLoaded")));
      } finally {
        setIsLoading(false);
      }
    }

    void loadData();
  }, [t]);

  function updateForm<K extends keyof SiteSettingsFormState>(
    key: K,
    value: SiteSettingsFormState[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      const savedSettings = await siteSettingsApi.saveSettings({
        siteName: form.siteName.trim(),
        logoMediaId: form.logoMediaId ? Number(form.logoMediaId) : null,
        footerText: nullable(form.footerText),
        contactEmail: nullable(form.contactEmail),
        phone: nullable(form.phone),
        facebookUrl: nullable(form.facebookUrl),
        linkedinUrl: nullable(form.linkedinUrl),
      });
      setForm({
        siteName: savedSettings.siteName,
        logoMediaId:
          savedSettings.logoMediaId == null ? "" : String(savedSettings.logoMediaId),
        footerText: savedSettings.footerText ?? "",
        contactEmail: savedSettings.contactEmail ?? "",
        phone: savedSettings.phone ?? "",
        facebookUrl: savedSettings.facebookUrl ?? "",
        linkedinUrl: savedSettings.linkedinUrl ?? "",
      });
      setSuccess(t("siteSettingsSaved"));
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, t("siteSettingsCouldNotBeSaved")));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="users-page">
      <div className="page-heading">
        <div>
          <h2>{t("siteSettings")}</h2>
          <p>{t("manageSiteSettings")}</p>
        </div>
      </div>

      <form className="user-form site-settings-form" onSubmit={handleSubmit}>
        {isLoading ? (
          <div className="inline-status">{t("loadingSiteSettings")}</div>
        ) : (
          <>
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <div className="site-settings-form__fields">
              <label>
                {t("siteName")}
                <input
                  name="siteName"
                  onChange={(event) => updateForm("siteName", event.target.value)}
                  required
                  type="text"
                  value={form.siteName}
                />
              </label>

              <label>
                {t("logo")}
                <select
                  name="logoMediaId"
                  onChange={(event) => updateForm("logoMediaId", event.target.value)}
                  value={form.logoMediaId}
                >
                  <option value="">{t("noMediaSelected")}</option>
                  {media.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.originalFileName}
                    </option>
                  ))}
                </select>
              </label>

              <label className="site-settings-form__wide">
                {t("footerText")}
                <textarea
                  name="footerText"
                  onChange={(event) => updateForm("footerText", event.target.value)}
                  rows={4}
                  value={form.footerText}
                />
              </label>

              <label>
                {t("contactEmail")}
                <input
                  name="contactEmail"
                  onChange={(event) => updateForm("contactEmail", event.target.value)}
                  type="email"
                  value={form.contactEmail}
                />
              </label>

              <label>
                {t("phone")}
                <input
                  name="phone"
                  onChange={(event) => updateForm("phone", event.target.value)}
                  type="tel"
                  value={form.phone}
                />
              </label>

              <label>
                {t("facebookUrl")}
                <input
                  name="facebookUrl"
                  onChange={(event) => updateForm("facebookUrl", event.target.value)}
                  type="url"
                  value={form.facebookUrl}
                />
              </label>

              <label>
                {t("linkedinUrl")}
                <input
                  name="linkedinUrl"
                  onChange={(event) => updateForm("linkedinUrl", event.target.value)}
                  type="url"
                  value={form.linkedinUrl}
                />
              </label>
            </div>

            <div className="form-actions">
              <button disabled={isSubmitting} type="submit">
                <ButtonLabel icon="save">
                  {isSubmitting ? t("saving") : t("saveSettings")}
                </ButtonLabel>
              </button>
            </div>
          </>
        )}
      </form>
    </section>
  );
}
