import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router";
import { ApiError } from "../api/httpClient";
import * as menuApi from "../api/menuApi";
import * as pageApi from "../api/pageApi";
import * as applicationApi from "../api/applicationApi";
import ButtonLabel from "../components/ui/ButtonLabel";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import SortableHeader, { useTableSort } from "../components/ui/SortableHeader";
import type { Menu, MenuItem, MenuItemTargetType } from "../models/menu";
import type { PageListItem } from "../models/page";
import type { Application } from "../models/application";
import { usePreferences } from "../preferences/PreferencesContext";
import { useSiteContext } from "../sites/SiteContext";

type MenuItemFormState = {
  applicationId: string;
  pageId: string;
  parentId: string;
  targetType: MenuItemTargetType;
  targetUrl: string;
  title: string;
  sortOrder: string;
  visible: boolean;
};

const emptyForm: MenuItemFormState = {
  applicationId: "",
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
  const { selectedSite } = useSiteContext();
  const { id } = useParams();
  const menuId = id === undefined ? null : Number(id);
  const hasInvalidId =
    menuId === null || !Number.isInteger(menuId) || menuId <= 0;
  const [menu, setMenu] = useState<Menu | null>(null);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [pages, setPages] = useState<PageListItem[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
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
  const applicationById = useMemo(
    () => new Map(applications.map((application) => [application.id, application])),
    [applications],
  );
  const itemById = useMemo(
    () => new Map(items.map((item) => [item.id, item])),
    [items],
  );
  const sortableItems = useMemo(
    () => items.map((item) => ({
      ...item,
      parentLabel: item.parentId == null ? "" : itemById.get(item.parentId)?.title ?? `#${item.parentId}`,
      targetLabel: item.targetType === "URL"
        ? item.targetUrl ?? ""
        : item.targetType === "APPLICATION"
          ? item.applicationName ?? applicationById.get(item.applicationId ?? -1)?.name ?? item.applicationCode ?? `#${item.applicationId ?? ""}`
          : item.pageId == null ? "" : pageById.get(item.pageId)?.title ?? `#${item.pageId}`,
    })),
    [applicationById, itemById, items, pageById],
  );
  const { getAriaSort, sort, sortedItems, toggleSort } = useTableSort(sortableItems);

  async function loadData(targetMenuId: number) {
    setIsLoading(true);
    setError("");

    try {
      const [loadedMenu, loadedItems, loadedPages, loadedApplications] = await Promise.all([
        menuApi.getMenu(selectedSite!.code, targetMenuId),
        menuApi.getMenuItems(selectedSite!.code, targetMenuId),
        pageApi.getPages(selectedSite!.code),
        applicationApi.getApplications(selectedSite!.code),
      ]);
      setMenu(loadedMenu);
      setItems(loadedItems);
      setPages(loadedPages);
      setApplications(loadedApplications);
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, t("menuItemsCouldNotBeLoaded")));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!hasInvalidId && menuId && selectedSite) {
      void loadData(menuId);
    }
  }, [hasInvalidId, menuId, selectedSite?.code]);

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
      applicationId: item.applicationId == null ? "" : String(item.applicationId),
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

    if (form.targetType === "APPLICATION" && !form.applicationId) {
      setError(t("applicationSelectionRequired"));
      return;
    }

    setIsSubmitting(true);

    try {
      const input = {
        menuId: validMenuId,
        parentId: form.parentId ? Number(form.parentId) : null,
        pageId: form.targetType === "PAGE" ? Number(form.pageId) : null,
        applicationId: form.targetType === "APPLICATION" ? Number(form.applicationId) : null,
        targetType: form.targetType,
        targetUrl: form.targetType === "URL" ? form.targetUrl.trim() : null,
        title: form.title.trim(),
        sortOrder: Number(form.sortOrder),
        visible: form.visible,
      };

      if (editedItemId) {
        if (!selectedSite) return;
        const updatedItem = await menuApi.updateMenuItem(selectedSite.code, validMenuId, editedItemId, input);
        setItems((current) =>
          current.map((item) => (item.id === updatedItem.id ? updatedItem : item)),
        );
      } else {
        if (!selectedSite) return;
        const createdItem = await menuApi.createMenuItem(selectedSite.code, validMenuId, input);
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
      if (!selectedSite) return;
      await menuApi.deleteMenuItem(selectedSite.code, validMenuId, item.id);
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
                      applicationId: targetType === "APPLICATION" ? current.applicationId : "",
                      targetUrl: targetType === "URL" ? current.targetUrl : "",
                    }));
                  }}
                  required
                  value={form.targetType}
                >
                  <option value="PAGE">{t("page")}</option>
                  <option value="URL">{t("externalUrl")}</option>
                  <option value="APPLICATION">{t("application")}</option>
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
              ) : form.targetType === "URL" ? (
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
              ) : (
                <label>
                  {t("application")}
                  <select
                    name="applicationId"
                    onChange={(event) => updateForm("applicationId", event.target.value)}
                    required
                    value={form.applicationId}
                  >
                    <option value="">{t("selectApplication")}</option>
                    {applications.map((application) => {
                      const isCurrentInactive =
                        application.id === Number(form.applicationId) && !application.active;
                      return (
                        <option disabled={!application.active && !isCurrentInactive} key={application.id} value={application.id}>
                          {application.name} ({application.code}){application.active ? "" : ` — ${t("inactive")}`}
                        </option>
                      );
                    })}
                  </select>
                  {form.applicationId && !applicationById.get(Number(form.applicationId)) && (
                    <span className="field-error">{t("applicationUnavailable")}</span>
                  )}
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
                  isSubmitting ||
                  (form.targetType === "PAGE" && pages.length === 0) ||
                  (form.targetType === "APPLICATION" && applications.filter((application) => application.active).length === 0 && !editedItemId)
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
                    <th aria-sort={getAriaSort("title")}><SortableHeader direction={sort?.key === "title" ? sort.direction : null} label={t("title")} onClick={() => toggleSort("title")} /></th>
                    <th aria-sort={getAriaSort("targetType")}><SortableHeader direction={sort?.key === "targetType" ? sort.direction : null} label={t("targetType")} onClick={() => toggleSort("targetType")} /></th>
                    <th aria-sort={getAriaSort("targetLabel")}><SortableHeader direction={sort?.key === "targetLabel" ? sort.direction : null} label={t("target")} onClick={() => toggleSort("targetLabel")} /></th>
                    <th aria-sort={getAriaSort("parentLabel")}><SortableHeader direction={sort?.key === "parentLabel" ? sort.direction : null} label={t("parent")} onClick={() => toggleSort("parentLabel")} /></th>
                    <th aria-sort={getAriaSort("sortOrder")}><SortableHeader direction={sort?.key === "sortOrder" ? sort.direction : null} label={t("sortOrder")} onClick={() => toggleSort("sortOrder")} /></th>
                    <th aria-sort={getAriaSort("visible")}><SortableHeader direction={sort?.key === "visible" ? sort.direction : null} label={t("visible")} onClick={() => toggleSort("visible")} /></th>
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
                          : item.targetType === "APPLICATION"
                            ? item.applicationName ?? applicationById.get(item.applicationId ?? -1)?.name ?? item.applicationCode ?? `#${item.applicationId ?? "-"}`
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
