import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router";
import { ApiError } from "../api/httpClient";
import * as userApi from "../api/userApi";
import ButtonLabel from "../components/ui/ButtonLabel";
import type { CreateUserRequest, RegistrationStatus, UpdateUserRequest, User, UserRole } from "../models/user";
import { usePreferences } from "../preferences/PreferencesContext";

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
  const { t } = usePreferences();
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
        setError(getErrorMessage(caughtError, t("userCouldNotBeLoaded")));
      } finally {
        setIsLoading(false);
      }
    }

    void loadUser(editedUserId);
  }, [editedUserId, t]);

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
      setError(getErrorMessage(caughtError, t("userCouldNotBeSaved")));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="users-page">
      <div className="page-heading">
        <div>
          <h2>{isEditMode ? t("editUser") : t("createUser")}</h2>
          <p>{isEditMode ? t("updateAccount") : t("addCmsAccount")}</p>
        </div>
        <Link className="secondary-link" to="/users">
          <ButtonLabel icon="back">{t("backToUsers")}</ButtonLabel>
        </Link>
      </div>

      <form className="user-form user-form--page" onSubmit={handleSubmit}>
        {isLoading ? (
          <div className="inline-status">{t("loadingUser")}</div>
        ) : (
          <>
            {error && <div className="error-message">{error}</div>}

            <label>
              {t("loginName")}
              <input
                name="loginName"
                onChange={(event) => updateForm("loginName", event.target.value)}
                required
                type="text"
                value={form.loginName}
              />
            </label>

            <label>
              {t("userName")}
              <input
                name="userName"
                onChange={(event) => updateForm("userName", event.target.value)}
                required
                type="text"
                value={form.userName}
              />
            </label>

            <label>
              {t("email")}
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
              {t("password")}
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
              {t("role")}
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
              {t("registrationStatus")}
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
              {t("active")}
            </label>

            <div className="form-actions">
              <button disabled={isSubmitting} type="submit">
                <ButtonLabel icon={isEditMode ? "save" : "create"}>
                  {isSubmitting ? t("saving") : isEditMode ? t("saveChanges") : t("createUser")}
                </ButtonLabel>
              </button>
              <Link className="secondary-link" to="/users">
                <ButtonLabel icon="cancel">{t("cancel")}</ButtonLabel>
              </Link>
            </div>
          </>
        )}
      </form>
    </section>
  );
}
