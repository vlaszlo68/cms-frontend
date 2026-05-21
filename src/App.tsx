import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router";
import { useAuth } from "./auth/AuthContext";
import AppLayout from "./components/layout/AppLayout";
import { usePreferences } from "./preferences/PreferencesContext";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import SettingsPage from "./pages/SettingsPage";
import UserFormPage from "./pages/UserFormPage";
import UsersPage from "./pages/UsersPage";

/**
 * Guards routes that require an authenticated CMS session.
 *
 * While the current session is being checked, the route renders a lightweight
 * loading state. Unauthenticated visitors are redirected to the login page.
 */
function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const { t } = usePreferences();

  if (isLoading) {
    return <div className="page-status">{t("loading")}</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function AdminRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  if (user?.role !== "ADMIN") {
    return <Navigate to="/" replace />;
  }

  return children;
}

/**
 * Guards public-only routes, such as the login page.
 *
 * Authenticated users are redirected back to the dashboard so they cannot open
 * the login screen again while an active session exists.
 */
function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const { t } = usePreferences();

  if (isLoading) {
    return <div className="page-status">{t("loading")}</div>;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}

/**
 * Defines the client-side route table for the CMS admin application.
 */
export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout>
              <DashboardPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <AppLayout>
                <UsersPage />
              </AppLayout>
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/users/new"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <AppLayout>
                <UserFormPage />
              </AppLayout>
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/users/:userId/edit"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <AppLayout>
                <UserFormPage />
              </AppLayout>
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/pages"
        element={
          <ProtectedRoute>
            <AppLayout>
              <div className="placeholder-page">
                <PagePlaceholder />
              </div>
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <AppLayout>
              <SettingsPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function PagePlaceholder() {
  const { t } = usePreferences();

  return (
    <>
      <h2>{t("pages")}</h2>
      <p>{t("pagesPlaceholder")}</p>
    </>
  );
}
