import type { SyntheticEvent } from "react";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import * as authApi from "../api/authApi";
import { ApiError } from "../api/httpClient";
import { useAuth } from "../auth/AuthContext";
import { useCaptchaChallenge } from "../auth/useCaptchaChallenge";
import CaptchaField from "../components/auth/CaptchaField";
import { usePreferences } from "../preferences/PreferencesContext";

/**
 * Renders the CMS login form and stores the session after successful sign-in.
 */
export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t } = usePreferences();
  const [loginName, setLoginName] = useState("");
  const [password, setPassword] = useState("");
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [captchaHoneypot, setCaptchaHoneypot] = useState("");
  const [authConfig, setAuthConfig] = useState<authApi.AuthConfig | null>(null);
  const [error, setError] = useState("");
  const [configError, setConfigError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    captchaError,
    captchaId,
    captchaImageUrl,
    isCaptchaLoading,
    loadCaptcha,
  } = useCaptchaChallenge("login", t("captchaCouldNotBeLoaded"), t("rateLimitMessage"));

  const loginCaptchaEnabled = authConfig?.loginCaptchaEnabled === true;

  const refreshCaptcha = useCallback(async () => {
    setCaptchaAnswer("");
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

        if (nextConfig.loginCaptchaEnabled) {
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

  /**
   * Submits credentials to the auth API and redirects to the dashboard on success.
   */
  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (loginCaptchaEnabled && !captchaId) {
      setError(t("captchaRequired"));
      return;
    }

    setIsSubmitting(true);

    try {
      await login({
        loginName,
        password,
        ...(loginCaptchaEnabled
          ? { captchaId, captchaAnswer: captchaAnswer.trim(), captchaHoneypot }
          : {}),
      });
      navigate("/", { replace: true });
    } catch (caughtError) {
      if (caughtError instanceof ApiError && caughtError.status === 429) {
        setError(t("rateLimitMessage"));
      } else if (caughtError instanceof ApiError && caughtError.code === "CAPTCHA_INVALID") {
        setError(t("captchaInvalid"));
      } else {
        setError(t("genericLoginFailed"));
      }

      if (loginCaptchaEnabled) {
        await refreshCaptcha();
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <div>
          <h1>{t("cmsLogin")}</h1>
          <p>{t("signInPrompt")}</p>
        </div>

        {authConfig === null && !configError && <div className="inline-status">{t("loading")}</div>}
        {configError && <div className="error-message">{configError}</div>}
        {error && <div className="error-message">{error}</div>}

        {authConfig !== null && !configError && (
          <>
            <label>
              {t("loginName")}
              <input
                autoComplete="username"
                name="loginName"
                onChange={(event) => setLoginName(event.target.value)}
                required
                type="text"
                value={loginName}
              />
            </label>

            <label>
              {t("password")}
              <input
                autoComplete="current-password"
                name="password"
                onChange={(event) => setPassword(event.target.value)}
                required
                type="password"
                value={password}
              />
            </label>

            <input
              aria-hidden="true"
              autoComplete="off"
              name="captchaHoneypot"
              onChange={(event) => setCaptchaHoneypot(event.target.value)}
              style={{ display: "none" }}
              tabIndex={-1}
              type="text"
              value={captchaHoneypot}
            />

            {loginCaptchaEnabled && (
              <CaptchaField
                captchaError={captchaError}
                captchaImageUrl={captchaImageUrl}
                isCaptchaLoading={isCaptchaLoading}
                onAnswerChange={setCaptchaAnswer}
                onRefresh={() => void refreshCaptcha()}
                value={captchaAnswer}
              />
            )}

            <button
              disabled={isSubmitting || isCaptchaLoading || (loginCaptchaEnabled && !captchaId)}
              type="submit"
            >
              {isSubmitting ? t("signingIn") : t("signIn")}
            </button>

            <Link className="secondary-link auth-inline-link" to="/register">
              {t("createAccount")}
            </Link>
          </>
        )}
      </form>
    </main>
  );
}
