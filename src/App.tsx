import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router";
import { useAuth } from "./auth/AuthContext";
import AppLayout from "./components/layout/AppLayout";
import { usePreferences } from "./preferences/PreferencesContext";
import { useSiteContext } from "./sites/SiteContext";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import MediaPage from "./pages/MediaPage";
import MenuFormPage from "./pages/MenuFormPage";
import MenuItemsPage from "./pages/MenuItemsPage";
import MenusPage from "./pages/MenusPage";
import PageBlockFormPage from "./pages/PageBlockFormPage";
import PageBlocksPage from "./pages/PageBlocksPage";
import PageFormPage from "./pages/PageFormPage";
import PagesPage from "./pages/PagesPage";
import RegisterPage from "./pages/RegisterPage";
import SettingsPage from "./pages/SettingsPage";
import SiteSettingsPage from "./pages/SiteSettingsPage";
import TemplateFormPage from "./pages/TemplateFormPage";
import TemplatesPage from "./pages/TemplatesPage";
import UserFormPage from "./pages/UserFormPage";
import UsersPage from "./pages/UsersPage";
import SitesPage from "./pages/SitesPage";
import SiteFormPage from "./pages/SiteFormPage";
import ApplicationsPage from "./pages/ApplicationsPage";
import ApplicationFormPage from "./pages/ApplicationFormPage";

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

/** Re-mount site-owned screens on context changes so old async/form state cannot be reused. */
function SiteOwnedRoute({ children }: { children: ReactNode }) {
  const { isLoading, selectedSite } = useSiteContext();
  if (isLoading) return <div className="page-status">Loading sites…</div>;
  if (!selectedSite) return <Navigate to="/sites" replace />;
  return <div key={selectedSite.code}>{children}</div>;
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
        path="/register"
        element={
          <PublicOnlyRoute>
            <RegisterPage />
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
        path="/sites"
        element={<ProtectedRoute><AdminRoute><AppLayout><SitesPage /></AppLayout></AdminRoute></ProtectedRoute>}
      />
      <Route path="/sites/new" element={<ProtectedRoute><AdminRoute><AppLayout><SiteFormPage /></AppLayout></AdminRoute></ProtectedRoute>} />
      <Route path="/sites/:siteCode/edit" element={<ProtectedRoute><AdminRoute><AppLayout><SiteFormPage /></AppLayout></AdminRoute></ProtectedRoute>} />
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
        path="/applications"
        element={<ProtectedRoute><AdminRoute><AppLayout><SiteOwnedRoute><ApplicationsPage /></SiteOwnedRoute></AppLayout></AdminRoute></ProtectedRoute>}
      />
      <Route
        path="/applications/new"
        element={<ProtectedRoute><AdminRoute><AppLayout><SiteOwnedRoute><ApplicationFormPage /></SiteOwnedRoute></AppLayout></AdminRoute></ProtectedRoute>}
      />
      <Route
        path="/applications/:id/edit"
        element={<ProtectedRoute><AdminRoute><AppLayout><SiteOwnedRoute><ApplicationFormPage /></SiteOwnedRoute></AppLayout></AdminRoute></ProtectedRoute>}
      />
      <Route
        path="/pages"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <AppLayout>
              <SiteOwnedRoute><PagesPage /></SiteOwnedRoute>
              </AppLayout>
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/media"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <AppLayout>
              <SiteOwnedRoute><MediaPage /></SiteOwnedRoute>
              </AppLayout>
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/menus"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <AppLayout>
              <SiteOwnedRoute><MenusPage /></SiteOwnedRoute>
              </AppLayout>
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/menus/new"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <AppLayout>
              <SiteOwnedRoute><MenuFormPage /></SiteOwnedRoute>
              </AppLayout>
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/menus/:id/edit"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <AppLayout>
              <SiteOwnedRoute><MenuFormPage /></SiteOwnedRoute>
              </AppLayout>
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/menus/:id/items"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <AppLayout>
              <SiteOwnedRoute><MenuItemsPage /></SiteOwnedRoute>
              </AppLayout>
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/pages/new"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <AppLayout>
              <SiteOwnedRoute><PageFormPage /></SiteOwnedRoute>
              </AppLayout>
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/templates"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <AppLayout>
                <TemplatesPage />
              </AppLayout>
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/templates/new"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <AppLayout>
                <TemplateFormPage />
              </AppLayout>
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/templates/:id/edit"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <AppLayout>
                <TemplateFormPage />
              </AppLayout>
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/site-settings"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <AppLayout>
              <SiteOwnedRoute><SiteSettingsPage /></SiteOwnedRoute>
              </AppLayout>
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/pages/:id/edit"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <AppLayout>
              <SiteOwnedRoute><PageFormPage /></SiteOwnedRoute>
              </AppLayout>
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/pages/:id/blocks"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <AppLayout>
              <SiteOwnedRoute><PageBlocksPage /></SiteOwnedRoute>
              </AppLayout>
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/pages/:id/blocks/new"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <AppLayout>
              <SiteOwnedRoute><PageBlockFormPage /></SiteOwnedRoute>
              </AppLayout>
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/pages/:id/blocks/:blockId/edit"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <AppLayout>
              <SiteOwnedRoute><PageBlockFormPage /></SiteOwnedRoute>
              </AppLayout>
            </AdminRoute>
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
