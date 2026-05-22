import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { ApiError } from "../api/httpClient";
import * as authApi from "../api/authApi";
import {
  getPasswordValidationErrors,
  isPasswordValidationCode,
  normalizePasswordPolicy,
  type PasswordValidationCode,
} from "../auth/passwordPolicy";
import { useCaptchaChallenge } from "../auth/useCaptchaChallenge";
import CaptchaField from "../components/auth/CaptchaField";
import PasswordRequirements from "../components/auth/PasswordRequirements";
import { usePreferences } from "../preferences/PreferencesContext";

type RegisterFormState = {
  loginName: string;
  userName: string;
  emailAddress: string;
  password: string;
  passwordConfirmation: string;
  captchaAnswer: string;
};

const emptyForm: RegisterFormState = {
  loginName: "",
  userName: "",
  emailAddress: "",
  password: "",
  passwordConfirmation: "",
  captchaAnswer: "",
};

export default function RegisterPage() {
  const { t } = usePreferences();
  const [form, setForm] = useState<RegisterFormState>(emptyForm);
  const [authConfig, setAuthConfig] = useState<authApi.AuthConfig | null>(null);
  const [formError, setFormError] = useState("");
  const [configError, setConfigError] = useState("");
  const [passwordErrors, setPasswordErrors] = useState<PasswordValidationCode[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const {
    captchaError,
    captchaId,
    captchaImageUrl,
    clearCaptcha,
    isCaptchaLoading,
    loadCaptcha,
  } = useCaptchaChallenge(t("captchaCouldNotBeLoaded"));

  const registrationCaptchaEnabled = authConfig?.registrationCaptchaEnabled === true;
  const passwordPolicy = useMemo(() => normalizePasswordPolicy(authConfig), [authConfig]);

  const refreshCaptcha = useCallback(async () => {
    setForm((current) => ({ ...current, captchaAnswer: "" }));
    await loadCaptcha();
  }, [loadCaptcha]);

  useEffect(() => {
    let isMounted = true;

    async function loadConfig() {
      setConfigError("");

      try {
        const nextConfig = await authApi.getAuthConfig();

        if (!isMounted) {
          return;
        }

        setAuthConfig(nextConfig);

        if (nextConfig.registrationCaptchaEnabled) {
          await refreshCaptcha();
        }
      } catch {
        if (isMounted) {
          setConfigError(t("authConfigCouldNotBeLoaded"));
        }
      }
    }

    void loadConfig();

    return () => {
      isMounted = false;
    };
  }, [refreshCaptcha, t]);

  function updateForm<K extends keyof RegisterFormState>(key: K, value: RegisterFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function getFriendlyError(error: ApiError) {
    if (error.status === 429 || error.code === "RATE_LIMITED") {
      return t("rateLimitMessage");
    }

    switch (error.code) {
      case "DUPLICATE_LOGIN_NAME":
        return t("duplicateLoginName");
      case "DUPLICATE_EMAIL_ADDRESS":
        return t("duplicateEmailAddress");
      case "CAPTCHA_INVALID":
        return t("captchaInvalid");
      case "VALIDATION_ERROR":
        return t("registrationValidationFailed");
      default:
        return t("registrationCouldNotBeCompleted");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setPasswordErrors([]);

    if (form.password !== form.passwordConfirmation) {
      setFormError(t("passwordsDoNotMatch"));
      return;
    }

    const nextPasswordErrors = getPasswordValidationErrors(form.password, passwordPolicy);

    if (nextPasswordErrors.length > 0) {
      setPasswordErrors(nextPasswordErrors);
      setFormError(t("registrationValidationFailed"));
      return;
    }

    if (registrationCaptchaEnabled && !captchaId) {
      setFormError(t("captchaRequired"));
      return;
    }

    setIsSubmitting(true);

    try {
      await authApi.register({
        loginName: form.loginName.trim(),
        userName: form.userName.trim(),
        emailAddress: form.emailAddress.trim(),
        password: form.password,
        ...(registrationCaptchaEnabled
          ? { captchaId, captchaAnswer: form.captchaAnswer.trim() }
          : {}),
      });
      setIsRegistered(true);
      clearCaptcha();
    } catch (caughtError) {
      if (caughtError instanceof ApiError) {
        setFormError(getFriendlyError(caughtError));
        setPasswordErrors(
          caughtError.validationErrors?.filter(isPasswordValidationCode) ?? [],
        );
      } else {
        setFormError(t("registrationCouldNotBeCompleted"));
      }

      if (registrationCaptchaEnabled) {
        await refreshCaptcha();
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <form className="login-card register-card" onSubmit={handleSubmit}>
        <div>
          <h1>{isRegistered ? t("registrationReceived") : t("createAccount")}</h1>
          <p>{isRegistered ? t("registrationPendingInfo") : t("registerPrompt")}</p>
        </div>

        {isRegistered ? (
          <>
            <div className="success-message">{t("registrationSuccess")}</div>
            <Link className="secondary-link auth-inline-link" to="/login">
              {t("backToLogin")}
            </Link>
          </>
        ) : (
          <>
            {authConfig === null && !configError && (
              <div className="inline-status">{t("loading")}</div>
            )}
            {configError && <div className="error-message">{configError}</div>}
            {formError && <div className="error-message">{formError}</div>}

            {authConfig !== null && !configError && (
              <>
                <label>
                  {t("loginName")}
                  <input
                    autoComplete="username"
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
                    autoComplete="name"
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
                    autoComplete="new-password"
                    name="password"
                    onChange={(event) => updateForm("password", event.target.value)}
                    required
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
                  {t("passwordConfirmation")}
                  <input
                    autoComplete="new-password"
                    name="passwordConfirmation"
                    onChange={(event) => updateForm("passwordConfirmation", event.target.value)}
                    required
                    type="password"
                    value={form.passwordConfirmation}
                  />
                </label>

                {registrationCaptchaEnabled && (
                  <CaptchaField
                    captchaError={captchaError}
                    captchaImageUrl={captchaImageUrl}
                    isCaptchaLoading={isCaptchaLoading}
                    onAnswerChange={(value) => updateForm("captchaAnswer", value)}
                    onRefresh={() => void refreshCaptcha()}
                    value={form.captchaAnswer}
                  />
                )}

                <button disabled={isSubmitting || isCaptchaLoading} type="submit">
                  {isSubmitting ? t("registering") : t("register")}
                </button>

                <Link className="secondary-link auth-inline-link" to="/login">
                  {t("backToLogin")}
                </Link>
              </>
            )}
          </>
        )}
      </form>
    </main>
  );
}
