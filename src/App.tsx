import { Navigate, Route, Routes } from "react-router-dom";
import { I18nProvider } from "./core/i18n/I18nContext";
import { HtmlLangSync } from "./core/i18n/HtmlLangSync";
import { AuthProvider, useAuth } from "./core/auth/AuthContext";
import { RequireAuth } from "./core/auth/RequireAuth";
import { ModuleRegistryProvider, useModuleRegistry } from "./core/modules/ModuleRegistryContext";
import { OdooConnectionProvider } from "./core/odoo/OdooConnectionContext";
import LoginPage from "./pages/auth/LoginPage";
import SignupPage from "./pages/auth/SignupPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import SystemControlPage from "./pages/system-control/SystemControlPage";
import AppWorkspacePage from "./pages/apps/AppWorkspacePage";
import AppForgePage from "./pages/forge/AppForgePage";
import ComingSoonPage from "./pages/ComingSoonPage";

function RootRedirect() {
  const { session } = useAuth();
  return <Navigate to={session ? "/dashboard" : "/login"} replace />;
}

function AppRoutes() {
  const { routes: moduleRoutes } = useModuleRegistry();

  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <DashboardPage />
          </RequireAuth>
        }
      />
      <Route
        path="/system-control"
        element={
          <RequireAuth>
            <SystemControlPage />
          </RequireAuth>
        }
      />
      <Route
        path="/apps/:tech"
        element={
          <RequireAuth>
            <AppWorkspacePage />
          </RequireAuth>
        }
      />
      <Route
        path="/forge"
        element={
          <RequireAuth>
            <AppForgePage />
          </RequireAuth>
        }
      />
      <Route
        path="/users-admin"
        element={
          <RequireAuth>
            <ComingSoonPage titleKey="m_users" />
          </RequireAuth>
        }
      />
      <Route
        path="/site-settings"
        element={
          <RequireAuth>
            <ComingSoonPage titleKey="m_site" />
          </RequireAuth>
        }
      />

      {/* Routes contributed by installed modules — appear only while
          the module is installed, disappear cleanly on uninstall. */}
      {moduleRoutes.map((route) => (
        <Route
          key={route.path}
          path={route.path}
          element={
            <RequireAuth>
              <>{route.element}</>
            </RequireAuth>
          }
        />
      ))}

      <Route path="*" element={<ComingSoonPage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <HtmlLangSync />
      <AuthProvider>
        <OdooConnectionProvider>
          <ModuleRegistryProvider>
            <AppRoutes />
          </ModuleRegistryProvider>
        </OdooConnectionProvider>
      </AuthProvider>
    </I18nProvider>
  );
}
