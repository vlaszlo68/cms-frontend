import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router";
import { ApiError } from "../api/httpClient";
import * as applicationApi from "../api/applicationApi";
import ButtonLabel from "../components/ui/ButtonLabel";
import type { CreateApplicationRequest } from "../models/application";
import { usePreferences } from "../preferences/PreferencesContext";
import { useSiteContext } from "../sites/SiteContext";

const emptyForm: CreateApplicationRequest = { code: "", name: "", active: true };

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

export default function ApplicationFormPage() {
  const navigate = useNavigate();
  const { t } = usePreferences();
  const { selectedSite } = useSiteContext();
  const { id } = useParams();
  const applicationId = id === undefined ? null : Number(id);
  const isEditMode = applicationId !== null;
  const hasInvalidId =
    id !== undefined && (applicationId === null || !Number.isInteger(applicationId) || applicationId <= 0);
  const [form, setForm] = useState<CreateApplicationRequest>(emptyForm);
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!applicationId || !selectedSite) return;
    const siteCode = selectedSite.code;
    const targetApplicationId = applicationId;

    async function loadApplication() {
      setIsLoading(true);
      setError("");
      try {
        const application = await applicationApi.getApplication(siteCode, targetApplicationId);
        setForm({ code: application.code, name: application.name, active: application.active });
      } catch (caughtError) {
        setError(getErrorMessage(caughtError, t("applicationCouldNotBeLoaded")));
      } finally {
        setIsLoading(false);
      }
    }

    void loadApplication();
  }, [applicationId, selectedSite?.code, t]);

  if (hasInvalidId) return <Navigate replace to="/applications" />;

  function updateForm<K extends keyof CreateApplicationRequest>(key: K, value: CreateApplicationRequest[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedSite) return;
    setError("");
    setIsSubmitting(true);
    try {
      const input = { code: form.code.trim(), name: form.name.trim(), active: form.active };
      if (applicationId) await applicationApi.updateApplication(selectedSite.code, applicationId, input);
      else await applicationApi.createApplication(selectedSite.code, input);
      navigate("/applications");
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, t("applicationCouldNotBeSaved")));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="users-page">
      <div className="page-heading">
        <div><h2>{isEditMode ? t("editApplication") : t("createApplication")}</h2><p>{isEditMode ? t("updateApplication") : t("addCmsApplication")}</p></div>
        <Link className="secondary-link" to="/applications"><ButtonLabel icon="back">{t("backToApplications")}</ButtonLabel></Link>
      </div>
      <form className="user-form user-form--page" onSubmit={handleSubmit}>
        {isLoading ? <div className="inline-status">{t("loadingApplication")}</div> : <>
          {error && <div className="error-message">{error}</div>}
          <label>{t("name")}<input name="name" onChange={(event) => updateForm("name", event.target.value)} required type="text" value={form.name} /></label>
          <label>{t("code")}<input name="code" onChange={(event) => updateForm("code", event.target.value)} required type="text" value={form.code} /></label>
          <p className="form-help">{t("applicationCodeHelp")}</p>
          <label className="checkbox-field"><input checked={form.active} name="active" onChange={(event) => updateForm("active", event.target.checked)} type="checkbox" />{t("active")}</label>
          <div className="form-actions"><button disabled={isSubmitting} type="submit"><ButtonLabel icon={isEditMode ? "save" : "create"}>{isSubmitting ? t("saving") : isEditMode ? t("saveChanges") : t("createApplication")}</ButtonLabel></button><Link className="secondary-link" to="/applications"><ButtonLabel icon="cancel">{t("cancel")}</ButtonLabel></Link></div>
        </>}
      </form>
    </section>
  );
}
