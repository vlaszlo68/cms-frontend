import { useAuth } from "../auth/AuthContext";
import { usePreferences } from "../preferences/PreferencesContext";

/**
 * Renders the authenticated user's dashboard landing page.
 */
export default function DashboardPage() {
  const { user } = useAuth();
  const { t } = usePreferences();

  return (
    <section className="dashboard-page">
      <h2>
        {t("welcome")} {user?.loginName}
      </h2>
    </section>
  );
}
