import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router";
import * as authApi from "../api/authApi";
import { ApiError } from "../api/httpClient";
import * as userApi from "../api/userApi";
import {
  getPasswordValidationErrors,
  isPasswordValidationCode,
  normalizePasswordPolicy,
  type PasswordValidationCode,
} from "../auth/passwordPolicy";
import PasswordRequirements from "../components/auth/PasswordRequirements";
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
  const [authConfig, setAuthConfig] = useState<authApi.AuthConfig | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(isEditMode);
  const [isConfigLoading, setIsConfigLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [configError, setConfigError] = useState("");
  const [passwordErrors, setPasswordErrors] = useState<PasswordValidationCode[]>([]);
  const hasInvalidUserId =
    userId !== undefined &&
    (editedUserId === null || !Number.isInteger(editedUserId) || editedUserId <= 0);
  const passwordPolicy = useMemo(() => normalizePasswordPolicy(authConfig), [authConfig]);
  const isLoading = isUserLoading || isConfigLoading;

  useEffect(() => {
    if (!editedUserId) {
      return;
    }

    async function loadUser(id: number) {
      setIsUserLoading(true);
      setError("");

      try {
        const user = await userApi.getUser(id);
        setForm(toFormState(user));
      } catch (caughtError) {
        setError(getErrorMessage(caughtError, t("userCouldNotBeLoaded")));
      } finally {
        setIsUserLoading(false);
      }
    }

    void loadUser(editedUserId);
  }, [editedUserId, t]);

  useEffect(() => {
    let isMounted = true;

    async function loadConfig() {
      setIsConfigLoading(true);
      setConfigError("");

      try {
        const nextConfig = await authApi.getAuthConfig();

        if (isMounted) {
          setAuthConfig(nextConfig);
        }
      } catch {
        if (isMounted) {
          setConfigError(t("authConfigCouldNotBeLoaded"));
        }
      } finally {
        if (isMounted) {
          setIsConfigLoading(false);
        }
      }
    }

    void loadConfig();

    return () => {
      isMounted = false;
    };
  }, [t]);

  if (hasInvalidUserId) {
    return <Navigate to="/users" replace />;
  }

  function updateForm<K extends keyof UserFormState>(key: K, value: UserFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPasswordErrors([]);

    const shouldValidatePassword = !isEditMode || form.password.length > 0;
    const nextPasswordErrors = shouldValidatePassword
      ? getPasswordValidationErrors(form.password, passwordPolicy)
      : [];

    if (nextPasswordErrors.length > 0) {
      setPasswordErrors(nextPasswordErrors);
      setError(t("passwordValidationFailed"));
      return;
    }

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
      if (caughtError instanceof ApiError) {
        setPasswordErrors(
          caughtError.validationErrors?.filter(isPasswordValidationCode) ?? [],
        );
      }

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
          <div className="inline-status">{isUserLoading ? t("loadingUser") : t("loading")}</div>
        ) : configError ? (
          <div className="error-message">{configError}</div>
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

            <PasswordRequirements
              password={form.password}
              passwordErrors={passwordErrors}
              passwordPolicy={passwordPolicy}
            />

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
