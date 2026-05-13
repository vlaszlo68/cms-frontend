import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function DashboardPage() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <main className="dashboard-page">
      <header className="app-header">
        <div>
          <span className="app-kicker">CMS</span>
          <h1>Welcome {user?.loginName}</h1>
        </div>
        <button className="secondary-button" onClick={handleLogout} type="button">
          Logout
        </button>
      </header>
    </main>
  );
}
