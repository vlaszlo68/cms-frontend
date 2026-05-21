import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { ApiError } from "../api/httpClient";
import * as userApi from "../api/userApi";
import ButtonLabel from "../components/ui/ButtonLabel";
import type { User } from "../models/user";
import type { DateFormat } from "../preferences/PreferencesContext";
import { usePreferences } from "../preferences/PreferencesContext";

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

function formatDate(value: string, language: string, dateFormat: DateFormat) {
  return new Intl.DateTimeFormat(language === "hu" ? "hu-HU" : "en-US", {
    dateStyle: dateFormat === "long" ? "full" : "medium",
    timeStyle: dateFormat === "long" ? "medium" : "short",
  }).format(new Date(value));
}

export default function UsersPage() {
  const { dateFormat, language, t } = usePreferences();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const sortedUsers = useMemo(
    () => [...users].sort((left, right) => left.loginName.localeCompare(right.loginName)),
    [users],
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

  async function handleDeactivate(user: User) {
    const confirmed = window.confirm(`${t("deactivateConfirm")} ${user.loginName}?`);

    if (!confirmed) {
      return;
    }

    setError("");

    try {
      const deactivatedUser = await userApi.deleteUser(user.id);
      setUsers((current) =>
        current.map((item) => (item.id === deactivatedUser.id ? deactivatedUser : item)),
      );
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, t("userCouldNotBeDeactivated")));
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
          <table className="users-table">
            <thead>
              <tr>
                <th>{t("loginName")}</th>
                <th>{t("userName")}</th>
                <th>{t("email")}</th>
                <th>{t("role")}</th>
                <th>{t("active")}</th>
                <th>{t("registration")}</th>
                <th>{t("created")}</th>
                <th>{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {sortedUsers.map((user) => (
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
                        onClick={() => void handleDeactivate(user)}
                        type="button"
                      >
                        <ButtonLabel icon="deactivate">{t("deactivate")}</ButtonLabel>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
