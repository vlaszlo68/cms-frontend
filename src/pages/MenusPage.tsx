import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { ApiError } from "../api/httpClient";
import * as menuApi from "../api/menuApi";
import ButtonLabel from "../components/ui/ButtonLabel";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import type { Menu } from "../models/menu";
import { usePreferences } from "../preferences/PreferencesContext";

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

export default function MenusPage() {
  const { tablePageSize, t } = usePreferences();
  const [menus, setMenus] = useState<Menu[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [menuToDelete, setMenuToDelete] = useState<Menu | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const sortedMenus = useMemo(
    () => [...menus].sort((left, right) => left.name.localeCompare(right.name)),
    [menus],
  );
  const totalPages = Math.max(1, Math.ceil(sortedMenus.length / tablePageSize));
  const paginatedMenus = useMemo(
    () => sortedMenus.slice((currentPage - 1) * tablePageSize, currentPage * tablePageSize),
    [currentPage, sortedMenus, tablePageSize],
  );

  async function loadMenus() {
    setIsLoading(true);
    setError("");

    try {
      setMenus(await menuApi.getMenus());
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, t("menusCouldNotBeLoaded")));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadMenus();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [tablePageSize]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  async function handleDelete(menu: Menu) {
    setError("");
    setPendingDeleteId(menu.id);

    try {
      await menuApi.deleteMenu(menu.id);
      setMenus((current) => current.filter((item) => item.id !== menu.id));
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, t("menuCouldNotBeDeleted")));
    } finally {
      setPendingDeleteId(null);
      setMenuToDelete(null);
    }
  }

  return (
    <section className="users-page">
      <div className="page-heading">
        <div>
          <h2>{t("menus")}</h2>
          <p>{t("manageMenus")}</p>
        </div>
        <div className="page-actions">
          <button className="secondary-button" onClick={() => void loadMenus()} type="button">
            <ButtonLabel icon="refresh">{t("refresh")}</ButtonLabel>
          </button>
          <Link className="button-link" to="/menus/new">
            <ButtonLabel icon="create">{t("newMenu")}</ButtonLabel>
          </Link>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="users-table-wrap">
        {isLoading ? (
          <div className="inline-status">{t("loadingMenus")}</div>
        ) : sortedMenus.length === 0 ? (
          <div className="inline-status">{t("noMenus")}</div>
        ) : (
          <>
            <table className="users-table users-table--menus">
              <thead>
                <tr>
                  <th>{t("name")}</th>
                  <th>{t("code")}</th>
                  <th>{t("active")}</th>
                  <th>{t("actions")}</th>
                </tr>
              </thead>
              <tbody>
                {paginatedMenus.map((menu) => (
                  <tr key={menu.id}>
                    <td>{menu.name}</td>
                    <td>{menu.code}</td>
                    <td>{menu.active ? t("yes") : t("no")}</td>
                    <td>
                      <div className="table-actions">
                        <Link className="secondary-link" to={`/menus/${menu.id}/items`}>
                          <ButtonLabel icon="edit">{t("menuItems")}</ButtonLabel>
                        </Link>
                        <Link className="secondary-link" to={`/menus/${menu.id}/edit`}>
                          <ButtonLabel icon="edit">{t("edit")}</ButtonLabel>
                        </Link>
                        <button
                          className="danger-button"
                          disabled={pendingDeleteId === menu.id}
                          onClick={() => setMenuToDelete(menu)}
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
            <div className="table-pagination">
              <button
                className="secondary-button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                type="button"
              >
                {t("previousPage")}
              </button>
              <span>
                {currentPage} / {totalPages}
              </span>
              <button
                className="secondary-button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                type="button"
              >
                {t("nextPage")}
              </button>
            </div>
          </>
        )}
      </div>

      {menuToDelete && (
        <ConfirmDialog
          cancelLabel={t("cancel")}
          confirmLabel={t("delete")}
          isDanger
          message={`${t("deleteMenuConfirm")} ${menuToDelete.name}?`}
          onCancel={() => setMenuToDelete(null)}
          onConfirm={() => void handleDelete(menuToDelete)}
          title={t("confirmDelete")}
        />
      )}
    </section>
  );
}
