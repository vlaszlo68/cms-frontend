import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router";
import { ApiError } from "../api/httpClient";
import * as menuApi from "../api/menuApi";
import ButtonLabel from "../components/ui/ButtonLabel";
import type { Menu } from "../models/menu";
import { usePreferences } from "../preferences/PreferencesContext";

type MenuFormState = Pick<Menu, "name" | "code" | "active">;

const emptyForm: MenuFormState = {
  name: "",
  code: "",
  active: true,
};

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

export default function MenuFormPage() {
  const navigate = useNavigate();
  const { t } = usePreferences();
  const { id } = useParams();
  const editedMenuId = id === undefined ? null : Number(id);
  const isEditMode = editedMenuId !== null;
  const hasInvalidId =
    id !== undefined &&
    (editedMenuId === null || !Number.isInteger(editedMenuId) || editedMenuId <= 0);
  const [form, setForm] = useState<MenuFormState>(emptyForm);
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!editedMenuId) {
      return;
    }

    async function loadMenu(menuId: number) {
      setIsLoading(true);
      setError("");

      try {
        const menu = await menuApi.getMenu(menuId);
        setForm({ name: menu.name, code: menu.code, active: menu.active });
      } catch (caughtError) {
        setError(getErrorMessage(caughtError, t("menuCouldNotBeLoaded")));
      } finally {
        setIsLoading(false);
      }
    }

    void loadMenu(editedMenuId);
  }, [editedMenuId, t]);

  if (hasInvalidId) {
    return <Navigate replace to="/menus" />;
  }

  function updateForm<K extends keyof MenuFormState>(key: K, value: MenuFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const input = {
        name: form.name.trim(),
        code: form.code.trim(),
        active: form.active,
      };

      if (editedMenuId) {
        await menuApi.updateMenu(editedMenuId, input);
      } else {
        await menuApi.createMenu(input);
      }

      navigate("/menus");
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, t("menuCouldNotBeSaved")));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="users-page">
      <div className="page-heading">
        <div>
          <h2>{isEditMode ? t("editMenu") : t("createMenu")}</h2>
          <p>{isEditMode ? t("updateMenu") : t("addCmsMenu")}</p>
        </div>
        <Link className="secondary-link" to="/menus">
          <ButtonLabel icon="back">{t("backToMenus")}</ButtonLabel>
        </Link>
      </div>

      <form className="user-form user-form--page" onSubmit={handleSubmit}>
        {isLoading ? (
          <div className="inline-status">{t("loadingMenu")}</div>
        ) : (
          <>
            {error && <div className="error-message">{error}</div>}

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
              {t("code")}
              <input
                name="code"
                onChange={(event) => updateForm("code", event.target.value)}
                required
                type="text"
                value={form.code}
              />
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
                  {isSubmitting ? t("saving") : isEditMode ? t("saveChanges") : t("createMenu")}
                </ButtonLabel>
              </button>
              <Link className="secondary-link" to="/menus">
                <ButtonLabel icon="cancel">{t("cancel")}</ButtonLabel>
              </Link>
            </div>
          </>
        )}
      </form>
    </section>
  );
}
