import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../auth/AuthContext";

/**
 * Renders the authenticated app header with account information and logout action.
 */
export default function Header() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  /**
   * Logs the user out and returns them to the login route.
   */
  async function handleLogout() {
    setIsLoggingOut(true);

    try {
      await logout();
      navigate("/login", { replace: true });
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <header className="app-header">
      <div>
        <span className="app-kicker">CMS</span>
        <h1>CMS Admin</h1>
      </div>
      <div className="app-header__user">
        <span className="app-header__login-name">{user?.loginName}</span>
        <button
          className="secondary-button"
          disabled={isLoggingOut}
          onClick={handleLogout}
          type="button"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
