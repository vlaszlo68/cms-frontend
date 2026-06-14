import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { ApiError } from "../api/httpClient";
import * as userApi from "../api/userApi";
import ButtonLabel from "../components/ui/ButtonLabel";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import type { User } from "../models/user";
import type { DateFormat } from "../preferences/PreferencesContext";
import { usePreferences } from "../preferences/PreferencesContext";

type SortDirection = "asc" | "desc";
type UserSortKey =
  | "loginName"
  | "userName"
  | "emailAddress"
  | "role"
  | "active"
  | "registrationStatus"
  | "createdAt";

type UserSortState = {
  key: UserSortKey;
  direction: SortDirection;
};

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

function formatDate(value: string | null, language: string, dateFormat: DateFormat) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat(language === "hu" ? "hu-HU" : "en-US", {
    dateStyle: dateFormat === "long" ? "full" : "medium",
    timeStyle: dateFormat === "long" ? "medium" : "short",
  }).format(new Date(value));
}

function compareValues(left: string | boolean | null, right: string | boolean | null) {
  if (typeof left === "boolean" && typeof right === "boolean") {
    return Number(left) - Number(right);
  }

  return String(left ?? "").localeCompare(String(right ?? ""));
}

export default function UsersPage() {
  const { dateFormat, language, tablePageSize, t } = usePreferences();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingActionUserId, setPendingActionUserId] = useState<number | null>(null);
  const [userToDeactivate, setUserToDeactivate] = useState<User | null>(null);
  const [sort, setSort] = useState<UserSortState | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const sortedUsers = useMemo(
    () => {
      if (!sort) {
        return users;
      }

      return [...users].sort((left, right) => {
        const result = compareValues(left[sort.key], right[sort.key]);
        return sort.direction === "asc" ? result : -result;
      });
    },
    [sort, users],
  );
  const totalPages = Math.max(1, Math.ceil(sortedUsers.length / tablePageSize));
  const paginatedUsers = useMemo(
    () =>
      sortedUsers.slice((currentPage - 1) * tablePageSize, currentPage * tablePageSize),
    [currentPage, sortedUsers, tablePageSize],
  );

  async function loadUsers() {
    setIsLoading(true);
    setError("");

    try {
      setUsers(await userApi.getUsers());
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, t("usersCouldNotBeLoaded")));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadUsers();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [sort, tablePageSize]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  function handleSort(key: UserSortKey) {
    setSort((current) => {
      if (current?.key !== key) {
        return { key, direction: "asc" };
      }

      if (current.direction === "asc") {
        return { key, direction: "desc" };
      }

      return null;
    });
  }

  function renderSortableHeader(key: UserSortKey, label: string) {
    const isActive = sort?.key === key;
    const indicator = isActive ? (sort.direction === "asc" ? " ▲" : " ▼") : "";

    return (
      <button className="sortable-header" onClick={() => handleSort(key)} type="button">
        {label}
        <span aria-hidden="true">{indicator}</span>
      </button>
    );
  }

  function getAriaSort(key: UserSortKey) {
    if (sort?.key !== key) {
      return "none";
    }

    return sort.direction === "asc" ? "ascending" : "descending";
  }

  async function handleDeactivate(user: User) {
    setError("");

    try {
      const deactivatedUser = await userApi.deleteUser(user.id);
      setUsers((current) =>
        current.map((item) => (item.id === deactivatedUser.id ? deactivatedUser : item)),
      );
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, t("userCouldNotBeDeactivated")));
    } finally {
      setUserToDeactivate(null);
    }
  }

  async function handleApprovalAction(user: User, action: "approve" | "reject") {
    setError("");
    setPendingActionUserId(user.id);

    try {
      const updatedUser =
        action === "approve"
          ? await userApi.approveUser(user.id)
          : await userApi.rejectUser(user.id);
      setUsers((current) =>
        current.map((item) => (item.id === updatedUser.id ? updatedUser : item)),
      );
    } catch (caughtError) {
      setError(
        getErrorMessage(
          caughtError,
          action === "approve" ? t("userCouldNotBeApproved") : t("userCouldNotBeRejected"),
        ),
      );
    } finally {
      setPendingActionUserId(null);
    }
  }

  return (
    <section className="users-page">
      <div className="page-heading">
        <div>
          <h2>{t("users")}</h2>
          <p>{t("manageUsers")}</p>
        </div>
        <div className="page-actions">
          <button className="secondary-button" onClick={() => void loadUsers()} type="button">
            <ButtonLabel icon="refresh">{t("refresh")}</ButtonLabel>
          </button>
          <Link className="button-link" to="/users/new">
            <ButtonLabel icon="create">{t("newUser")}</ButtonLabel>
          </Link>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="users-table-wrap">
        {isLoading ? (
          <div className="inline-status">{t("loadingUsers")}</div>
        ) : sortedUsers.length === 0 ? (
          <div className="inline-status">{t("noUsers")}</div>
        ) : (
          <>
            <table className="users-table">
              <thead>
                <tr>
                  <th aria-sort={getAriaSort("loginName")}>
                    {renderSortableHeader("loginName", t("loginName"))}
                  </th>
                  <th aria-sort={getAriaSort("userName")}>
                    {renderSortableHeader("userName", t("userName"))}
                  </th>
                  <th aria-sort={getAriaSort("emailAddress")}>
                    {renderSortableHeader("emailAddress", t("email"))}
                  </th>
                  <th aria-sort={getAriaSort("role")}>
                    {renderSortableHeader("role", t("role"))}
                  </th>
                  <th aria-sort={getAriaSort("active")}>
                    {renderSortableHeader("active", t("active"))}
                  </th>
                  <th aria-sort={getAriaSort("registrationStatus")}>
                    {renderSortableHeader("registrationStatus", t("registration"))}
                  </th>
                  <th aria-sort={getAriaSort("createdAt")}>
                    {renderSortableHeader("createdAt", t("created"))}
                  </th>
                  <th>{t("actions")}</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map((user) => (
                  <tr key={user.id}>
                    <td>{user.loginName}</td>
                    <td>{user.userName}</td>
                    <td>{user.emailAddress}</td>
                    <td>{user.role}</td>
                    <td>{user.active ? t("yes") : t("no")}</td>
                    <td>{user.registrationStatus}</td>
                    <td>{formatDate(user.createdAt, language, dateFormat)}</td>
                    <td>
                      <div className="table-actions">
                        <Link className="secondary-link" to={`/users/${user.id}/edit`}>
                          <ButtonLabel icon="edit">{t("edit")}</ButtonLabel>
                        </Link>
                        <button
                          className="danger-button"
                          disabled={!user.active}
                          onClick={() => setUserToDeactivate(user)}
                          type="button"
                        >
                          <ButtonLabel icon="deactivate">{t("deactivate")}</ButtonLabel>
                        </button>
                        {user.registrationStatus === "PENDING" && (
                          <>
                            <button
                              disabled={pendingActionUserId === user.id}
                              onClick={() => void handleApprovalAction(user, "approve")}
                              type="button"
                            >
                              <ButtonLabel icon="save">{t("approve")}</ButtonLabel>
                            </button>
                            <button
                              className="danger-button"
                              disabled={pendingActionUserId === user.id}
                              onClick={() => void handleApprovalAction(user, "reject")}
                              type="button"
                            >
                              <ButtonLabel icon="cancel">{t("reject")}</ButtonLabel>
                            </button>
                          </>
                        )}
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
      {userToDeactivate && (
        <ConfirmDialog
          cancelLabel={t("cancel")}
          confirmLabel={t("deactivate")}
          isDanger
          message={`${t("deactivateConfirm")} ${userToDeactivate.loginName}?`}
          onCancel={() => setUserToDeactivate(null)}
          onConfirm={() => void handleDeactivate(userToDeactivate)}
          title={t("confirmDeactivate")}
        />
      )}
    </section>
  );
}
