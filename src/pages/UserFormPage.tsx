import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router";
import { ApiError } from "../api/httpClient";
import * as userApi from "../api/userApi";
import type { CreateUserRequest, RegistrationStatus, UpdateUserRequest, User, UserRole } from "../models/user";

const roles: UserRole[] = ["USER", "ADMIN"];
const registrationStatuses: RegistrationStatus[] = [
  "PENDING",
  "EMAIL_VERIFICATION_REQUIRED",
  "COMPLETED",
  "REJECTED",
];

type UserFormState = {
  loginName: string;
  userName: string;
  emailAddress: string;
  password: string;
  role: UserRole;
  active: boolean;
  registrationStatus: RegistrationStatus;
};

const emptyForm: UserFormState = {
  loginName: "",
  userName: "",
  emailAddress: "",
  password: "",
  role: "USER",
  active: true,
  registrationStatus: "PENDING",
};

function toFormState(user: User): UserFormState {
  return {
    loginName: user.loginName,
    userName: user.userName,
    emailAddress: user.emailAddress,
    password: "",
    role: user.role,
    active: user.active,
    registrationStatus: user.registrationStatus,
  };
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

export default function UserFormPage() {
  const navigate = useNavigate();
  const { userId } = useParams();
  const editedUserId = userId === undefined ? null : Number(userId);
  const isEditMode = editedUserId !== null;
  const [form, setForm] = useState<UserFormState>(emptyForm);
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const hasInvalidUserId =
    userId !== undefined &&
    (editedUserId === null || !Number.isInteger(editedUserId) || editedUserId <= 0);

  useEffect(() => {
    if (!editedUserId) {
      return;
    }

    async function loadUser(id: number) {
      setIsLoading(true);
      setError("");

      try {
        const user = await userApi.getUser(id);
        setForm(toFormState(user));
      } catch (caughtError) {
        setError(getErrorMessage(caughtError, "User could not be loaded."));
      } finally {
        setIsLoading(false);
      }
    }

    void loadUser(editedUserId);
  }, [editedUserId]);

  if (hasInvalidUserId) {
    return <Navigate to="/users" replace />;
  }

  function updateForm<K extends keyof UserFormState>(key: K, value: UserFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const baseInput = {
        loginName: form.loginName.trim(),
        userName: form.userName.trim(),
        emailAddress: form.emailAddress.trim(),
        role: form.role,
        active: form.active,
        registrationStatus: form.registrationStatus,
      };

      if (editedUserId) {
        const input: UpdateUserRequest = {
          ...baseInput,
          password: form.password.trim() ? form.password : null,
        };
        await userApi.updateUser(editedUserId, input);
      } else {
        const input: CreateUserRequest = {
          ...baseInput,
          password: form.password,
        };
        await userApi.createUser(input);
      }

      navigate("/users");
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, "User could not be saved."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="users-page">
      <div className="page-heading">
        <div>
          <h2>{isEditMode ? "Edit user" : "Create user"}</h2>
          <p>{isEditMode ? "Update account details and access." : "Add a new CMS account."}</p>
        </div>
        <Link className="secondary-link" to="/users">
          Back to users
        </Link>
      </div>

      <form className="user-form user-form--page" onSubmit={handleSubmit}>
        {isLoading ? (
          <div className="inline-status">Loading user...</div>
        ) : (
          <>
            {error && <div className="error-message">{error}</div>}

            <label>
              Login name
              <input
                name="loginName"
                onChange={(event) => updateForm("loginName", event.target.value)}
                required
                type="text"
                value={form.loginName}
              />
            </label>

            <label>
              User name
              <input
                name="userName"
                onChange={(event) => updateForm("userName", event.target.value)}
                required
                type="text"
                value={form.userName}
              />
            </label>

            <label>
              Email
              <input
                autoComplete="email"
                name="emailAddress"
                onChange={(event) => updateForm("emailAddress", event.target.value)}
                required
                type="email"
                value={form.emailAddress}
              />
            </label>

            <label>
              Password
              <input
                autoComplete={isEditMode ? "new-password" : "current-password"}
                name="password"
                onChange={(event) => updateForm("password", event.target.value)}
                required={!isEditMode}
                type="password"
                value={form.password}
              />
            </label>

            <label>
              Role
              <select
                name="role"
                onChange={(event) => updateForm("role", event.target.value as UserRole)}
                required
                value={form.role}
              >
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Registration status
              <select
                name="registrationStatus"
                onChange={(event) =>
                  updateForm("registrationStatus", event.target.value as RegistrationStatus)
                }
                value={form.registrationStatus}
              >
                {registrationStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
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
              Active
            </label>

            <div className="form-actions">
              <button disabled={isSubmitting} type="submit">
                {isSubmitting ? "Saving..." : isEditMode ? "Save changes" : "Create user"}
              </button>
              <Link className="secondary-link" to="/users">
                Cancel
              </Link>
            </div>
          </>
        )}
      </form>
    </section>
  );
}
