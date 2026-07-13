import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router";
import { ApiError } from "../api/httpClient";
import * as menuApi from "../api/menuApi";
import * as pageApi from "../api/pageApi";
import ButtonLabel from "../components/ui/ButtonLabel";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import type { Menu, MenuItem, MenuItemTargetType } from "../models/menu";
import type { PageListItem } from "../models/page";
import { usePreferences } from "../preferences/PreferencesContext";

type MenuItemFormState = {
  pageId: string;
  parentId: string;
  targetType: MenuItemTargetType;
  targetUrl: string;
  title: string;
  sortOrder: string;
  visible: boolean;
};

const emptyForm: MenuItemFormState = {
  pageId: "",
  parentId: "",
  targetType: "PAGE",
  targetUrl: "",
  title: "",
  sortOrder: "0",
  visible: true,
};

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

export default function MenuItemsPage() {
  const { t } = usePreferences();
  const { id } = useParams();
  const menuId = id === undefined ? null : Number(id);
  const hasInvalidId =
    menuId === null || !Number.isInteger(menuId) || menuId <= 0;
  const [menu, setMenu] = useState<Menu | null>(null);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [pages, setPages] = useState<PageListItem[]>([]);
  const [form, setForm] = useState<MenuItemFormState>(emptyForm);
  const [editedItemId, setEditedItemId] = useState<number | null>(null);
  const [itemToDelete, setItemToDelete] = useState<MenuItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const pageById = useMemo(
    () => new Map(pages.map((page) => [page.id, page])),
    [pages],
  );
  const itemById = useMemo(
    () => new Map(items.map((item) => [item.id, item])),
    [items],
  );
  const sortedItems = useMemo(
    () =>
      [...items].sort(
        (left, right) =>
          left.sortOrder - right.sortOrder || left.title.localeCompare(right.title),
      ),
    [items],
  );

  async function loadData(targetMenuId: number) {
    setIsLoading(true);
    setError("");

    try {
      const [loadedMenu, loadedItems, loadedPages] = await Promise.all([
        menuApi.getMenu(targetMenuId),
        menuApi.getMenuItems(targetMenuId),
        pageApi.getPages(),
      ]);
      setMenu(loadedMenu);
      setItems(loadedItems);
      setPages(loadedPages);
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, t("menuItemsCouldNotBeLoaded")));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!hasInvalidId && menuId) {
      void loadData(menuId);
    }
  }, [hasInvalidId, menuId]);

  if (hasInvalidId) {
    return <Navigate replace to="/menus" />;
  }

  const validMenuId = menuId as number;

  function updateForm<K extends keyof MenuItemFormState>(
    key: K,
    value: MenuItemFormState[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function resetForm() {
    setEditedItemId(null);
    setForm(emptyForm);
  }

  function startEdit(item: MenuItem) {
    setEditedItemId(item.id);
    setForm({
      pageId: item.pageId == null ? "" : String(item.pageId),
      parentId: item.parentId == null ? "" : String(item.parentId),
      targetType: item.targetType ?? "PAGE",
      targetUrl: item.targetUrl ?? "",
      title: item.title,
      sortOrder: String(item.sortOrder),
      visible: item.visible,
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (form.targetType === "PAGE" && !form.pageId) {
      setError(t("pageSelectionRequired"));
      return;
    }

    if (form.targetType === "URL" && !form.targetUrl.trim()) {
      setError(t("targetUrlRequired"));
      return;
    }

    setIsSubmitting(true);

    try {
      const input = {
        menuId: validMenuId,
        parentId: form.parentId ? Number(form.parentId) : null,
        pageId: form.targetType === "PAGE" ? Number(form.pageId) : null,
        targetType: form.targetType,
        targetUrl: form.targetType === "URL" ? form.targetUrl.trim() : null,
        title: form.title.trim(),
        sortOrder: Number(form.sortOrder),
        visible: form.visible,
      };

      if (editedItemId) {
        const updatedItem = await menuApi.updateMenuItem(editedItemId, input);
        setItems((current) =>
          current.map((item) => (item.id === updatedItem.id ? updatedItem : item)),
        );
      } else {
        const createdItem = await menuApi.createMenuItem(input);
        setItems((current) => [...current, createdItem]);
      }

      resetForm();
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, t("menuItemCouldNotBeSaved")));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(item: MenuItem) {
    setError("");

    try {
      await menuApi.deleteMenuItem(item.id);
      setItems((current) => current.filter((candidate) => candidate.id !== item.id));

      if (editedItemId === item.id) {
        resetForm();
      }
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, t("menuItemCouldNotBeDeleted")));
    } finally {
      setItemToDelete(null);
    }
  }

  return (
    <section className="users-page">
      <div className="page-heading">
        <div>
          <h2>{t("menuItems")}{menu ? ` — ${menu.name}` : ""}</h2>
          <p>{t("manageMenuItems")}</p>
        </div>
        <div className="page-actions">
          <button
            className="secondary-button"
            onClick={() => void loadData(validMenuId)}
            type="button"
          >
            <ButtonLabel icon="refresh">{t("refresh")}</ButtonLabel>
          </button>
          <Link className="secondary-link" to="/menus">
            <ButtonLabel icon="back">{t("backToMenus")}</ButtonLabel>
          </Link>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {isLoading ? (
        <div className="users-table-wrap">
          <div className="inline-status">{t("loadingMenuItems")}</div>
        </div>
      ) : (
        <>
          <form className="user-form menu-item-form" onSubmit={handleSubmit}>
            <h3>{editedItemId ? t("editMenuItem") : t("createMenuItem")}</h3>

            <div className="menu-item-form__fields">
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
                {t("targetType")}
                <select
                  name="targetType"
                  onChange={(event) => {
                    const targetType = event.target.value as MenuItemTargetType;
                    setForm((current) => ({
                      ...current,
                      targetType,
                      pageId: targetType === "PAGE" ? current.pageId : "",
                      targetUrl: targetType === "URL" ? current.targetUrl : "",
                    }));
                  }}
                  required
                  value={form.targetType}
                >
                  <option value="PAGE">{t("page")}</option>
                  <option value="URL">{t("externalUrl")}</option>
                </select>
              </label>

              {form.targetType === "PAGE" ? (
                <label>
                  {t("page")}
                  <select
                    name="pageId"
                    onChange={(event) => updateForm("pageId", event.target.value)}
                    required
                    value={form.pageId}
                  >
                    <option value="">{t("selectPage")}</option>
                    {pages.map((page) => (
                      <option key={page.id} value={page.id}>
                        {page.title}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <label>
                  {t("targetUrl")}
                  <input
                    name="targetUrl"
                    onChange={(event) => updateForm("targetUrl", event.target.value)}
                    placeholder="https://example.com"
                    required
                    type="url"
                    value={form.targetUrl}
                  />
                </label>
              )}

              <label>
                {t("parentItem")}
                <select
                  name="parentId"
                  onChange={(event) => updateForm("parentId", event.target.value)}
                  value={form.parentId}
                >
                  <option value="">{t("noParent")}</option>
                  {sortedItems
                    .filter((item) => item.id !== editedItemId)
                    .map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.title}
                      </option>
                    ))}
                </select>
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

              <label className="checkbox-field menu-item-form__checkbox">
                <input
                  checked={form.visible}
                  name="visible"
                  onChange={(event) => updateForm("visible", event.target.checked)}
                  type="checkbox"
                />
                {t("visible")}
              </label>
            </div>

            <div className="form-actions">
              <button
                disabled={
                  isSubmitting || (form.targetType === "PAGE" && pages.length === 0)
                }
                type="submit"
              >
                <ButtonLabel icon={editedItemId ? "save" : "create"}>
                  {isSubmitting
                    ? t("saving")
                    : editedItemId
                      ? t("saveChanges")
                      : t("createMenuItem")}
                </ButtonLabel>
              </button>
              {editedItemId && (
                <button className="secondary-button" onClick={resetForm} type="button">
                  <ButtonLabel icon="cancel">{t("cancel")}</ButtonLabel>
                </button>
              )}
            </div>
          </form>

          <div className="users-table-wrap">
            {sortedItems.length === 0 ? (
              <div className="inline-status">{t("noMenuItems")}</div>
            ) : (
              <table className="users-table users-table--menu-items">
                <thead>
                  <tr>
                    <th>{t("title")}</th>
                    <th>{t("targetType")}</th>
                    <th>{t("target")}</th>
                    <th>{t("parent")}</th>
                    <th>{t("sortOrder")}</th>
                    <th>{t("visible")}</th>
                    <th>{t("actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedItems.map((item) => (
                    <tr key={item.id}>
                      <td>{item.title}</td>
                      <td>{item.targetType}</td>
                      <td>
                        {item.targetType === "URL"
                          ? item.targetUrl ?? "-"
                          : item.pageId == null
                            ? "-"
                            : pageById.get(item.pageId)?.title ?? `#${item.pageId}`}
                      </td>
                      <td>
                        {item.parentId == null
                          ? "-"
                          : itemById.get(item.parentId)?.title ?? `#${item.parentId}`}
                      </td>
                      <td>{item.sortOrder}</td>
                      <td>{item.visible ? t("yes") : t("no")}</td>
                      <td>
                        <div className="table-actions">
                          <button
                            className="secondary-button"
                            onClick={() => startEdit(item)}
                            type="button"
                          >
                            <ButtonLabel icon="edit">{t("edit")}</ButtonLabel>
                          </button>
                          <button
                            className="danger-button"
                            onClick={() => setItemToDelete(item)}
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
        </>
      )}

      {itemToDelete && (
        <ConfirmDialog
          cancelLabel={t("cancel")}
          confirmLabel={t("delete")}
          isDanger
          message={`${t("deleteMenuItemConfirm")} ${itemToDelete.title}?`}
          onCancel={() => setItemToDelete(null)}
          onConfirm={() => void handleDelete(itemToDelete)}
          title={t("confirmDelete")}
        />
      )}
    </section>
  );
}
