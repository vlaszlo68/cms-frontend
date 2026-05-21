import type { SyntheticEvent } from "react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { ApiError } from "../api/httpClient";
import { useAuth } from "../auth/AuthContext";
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
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Submits credentials to the auth API and redirects to the dashboard on success.
   */
  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await login({ loginName, password });
      navigate("/", { replace: true });
    } catch (caughtError) {
      if (caughtError instanceof ApiError) {
        setError(caughtError.message);
      } else {
        setError(t("loginFailed"));
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

        {error && <div className="error-message">{error}</div>}

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

        <button disabled={isSubmitting} type="submit">
          {isSubmitting ? t("signingIn") : t("signIn")}
        </button>
      </form>
    </main>
  );
}
