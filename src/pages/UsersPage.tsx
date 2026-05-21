import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { ApiError } from "../api/httpClient";
import * as userApi from "../api/userApi";
import type { User } from "../models/user";

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function UsersPage() {
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
      setError(getErrorMessage(caughtError, "Users could not be loaded."));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadUsers();
  }, []);

  async function handleDeactivate(user: User) {
    const confirmed = window.confirm(`Deactivate ${user.loginName}?`);

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
      setError(getErrorMessage(caughtError, "User could not be deactivated."));
    }
  }

  return (
    <section className="users-page">
      <div className="page-heading">
        <div>
          <h2>Users</h2>
          <p>Manage CMS accounts, roles, and active access.</p>
        </div>
        <div className="page-actions">
          <button className="secondary-button" onClick={() => void loadUsers()} type="button">
            Refresh
          </button>
          <Link className="button-link" to="/users/new">
            New user
          </Link>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="users-table-wrap">
        {isLoading ? (
          <div className="inline-status">Loading users...</div>
        ) : sortedUsers.length === 0 ? (
          <div className="inline-status">No users yet.</div>
        ) : (
          <table className="users-table">
            <thead>
              <tr>
                <th>Login name</th>
                <th>User name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Active</th>
                <th>Registration</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedUsers.map((user) => (
                <tr key={user.id}>
                  <td>{user.loginName}</td>
                  <td>{user.userName}</td>
                  <td>{user.emailAddress}</td>
                  <td>{user.role}</td>
                  <td>{user.active ? "Yes" : "No"}</td>
                  <td>{user.registrationStatus}</td>
                  <td>{formatDate(user.createdAt)}</td>
                  <td>
                    <div className="table-actions">
                      <Link className="secondary-link" to={`/users/${user.id}/edit`}>
                        Edit
                      </Link>
                      <button
                        className="danger-button"
                        disabled={!user.active}
                        onClick={() => void handleDeactivate(user)}
                        type="button"
                      >
                        Deactivate
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
