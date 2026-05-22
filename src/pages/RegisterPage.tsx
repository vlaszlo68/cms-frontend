import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { ApiError } from "../api/httpClient";
import * as authApi from "../api/authApi";
import { useCaptchaChallenge } from "../auth/useCaptchaChallenge";
import CaptchaField from "../components/auth/CaptchaField";
import { usePreferences } from "../preferences/PreferencesContext";

type RegisterFormState = {
  loginName: string;
  userName: string;
  emailAddress: string;
  password: string;
  passwordConfirmation: string;
  captchaAnswer: string;
};

type PasswordValidationCode =
  | "TOO_SHORT"
  | "MISSING_UPPERCASE"
  | "MISSING_LOWERCASE"
  | "MISSING_DIGIT"
  | "MISSING_SPECIAL";

type PasswordRequirement = {
  code: PasswordValidationCode;
  labelKey:
    | "passwordMinLengthRequirement"
    | "passwordUppercaseRequirement"
    | "passwordLowercaseRequirement"
    | "passwordDigitRequirement"
    | "passwordSpecialRequirement";
  isMet: (password: string) => boolean;
};

const emptyForm: RegisterFormState = {
  loginName: "",
  userName: "",
  emailAddress: "",
  password: "",
  passwordConfirmation: "",
  captchaAnswer: "",
};

const passwordRequirements: PasswordRequirement[] = [
  {
    code: "TOO_SHORT",
    labelKey: "passwordMinLengthRequirement",
    isMet: (password) => password.length >= 8,
  },
  {
    code: "MISSING_UPPERCASE",
    labelKey: "passwordUppercaseRequirement",
    isMet: (password) => /[A-Z]/.test(password),
  },
  {
    code: "MISSING_LOWERCASE",
    labelKey: "passwordLowercaseRequirement",
    isMet: (password) => /[a-z]/.test(password),
  },
  {
    code: "MISSING_DIGIT",
    labelKey: "passwordDigitRequirement",
    isMet: (password) => /\d/.test(password),
  },
  {
    code: "MISSING_SPECIAL",
    labelKey: "passwordSpecialRequirement",
    isMet: (password) => /[^A-Za-z0-9]/.test(password),
  },
];

function isPasswordValidationCode(value: string): value is PasswordValidationCode {
  return passwordRequirements.some((requirement) => requirement.code === value);
}

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

  const passwordErrorSet = useMemo(() => new Set(passwordErrors), [passwordErrors]);
  const registrationCaptchaEnabled = authConfig?.registrationCaptchaEnabled === true;

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

            <div className="password-requirements" aria-label={t("passwordRequirements")}>
              {passwordRequirements.map((requirement) => {
                const isMet = requirement.isMet(form.password);
                const hasBackendError = passwordErrorSet.has(requirement.code);

                return (
                  <span
                    className={
                      isMet && !hasBackendError
                        ? "password-requirement password-requirement--met"
                        : "password-requirement"
                    }
                    key={requirement.code}
                  >
                    {t(requirement.labelKey)}
                  </span>
                );
              })}
            </div>

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
