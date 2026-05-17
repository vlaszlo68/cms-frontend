import type { SyntheticEvent } from "react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { ApiError } from "../api/httpClient";
import { useAuth } from "../auth/AuthContext";

/**
 * Renders the CMS login form and stores the session after successful sign-in.
 */
export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
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
        setError("Login failed. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <div>
          <h1>CMS Login</h1>
          <p>Sign in with your CMS account.</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <label>
          Login name
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
          Password
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
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </main>
  );
}
