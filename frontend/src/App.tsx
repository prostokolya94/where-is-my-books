import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { rootStore } from './stores/rootStore';
import { authStore } from './stores/authStore';
import { flagsStore } from './stores/flagsStore';
import { api } from './api/client';
import Sidebar from './components/Sidebar';
import UserMenu from './components/UserMenu';
import ConfirmEmailBanner from './components/ConfirmEmailBanner';
import BooksPage from './pages/BooksPage';
import TabPage from './pages/TabPage';
import CategoriesPage from './pages/CategoriesPage';
import StatsPage from './pages/StatsPage';
import PlansPage from './pages/PlansPage';
import UnreadMonitoringPage from './pages/UnreadMonitoringPage';
import ReadMonitoringPage from './pages/ReadMonitoringPage';
import CostPage from './pages/CostPage';
import AdminPage from './pages/AdminPage';
import AboutPage from './pages/AboutPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ConfirmEmailPage from './pages/ConfirmEmailPage';
import TabEditorModal from './components/TabEditorModal';
import BackupsModal from './components/BackupsModal';
import { uiStore } from './stores/uiStore';

function pageFromPath(pathname: string): string | null {
  if (pathname === '/') return 'books';
  if (pathname.startsWith('/tabs/')) return 'tab';
  const map: Record<string, string> = {
    '/categories': 'categories',
    '/stats': 'stats',
    '/plans': 'plans',
    '/unread': 'unread',
    '/read': 'read',
    '/costs': 'costs',
    '/admin': 'admin',
  };
  return map[pathname] ?? null;
}

const PageGuard = observer(
  ({ flag, children }: { flag: string; children: ReactNode }) => {
    if (flagsStore.isEnabled(flag)) return <>{children}</>;
    return <Navigate to={flagsStore.fallbackPath()} replace />;
  },
);

const LockedPage = () => (
  <div className="page">
    <div className="page-header">
      <h1 className="page-title">Страницы отключены</h1>
      <p className="page-subtitle">
        Администратор отключил доступные вкладки. Загляните позже.
      </p>
    </div>
  </div>
);

const AppShell = observer(() => {
  useEffect(() => {
    rootStore.init();
  }, []);

  const location = useLocation();
  const lastTracked = useRef<{ path: string; at: number } | null>(null);
  useEffect(() => {
    const page = pageFromPath(location.pathname);
    if (!page) return;
    const now = Date.now();
    if (
      lastTracked.current &&
      lastTracked.current.path === location.pathname &&
      now - lastTracked.current.at < 2000
    ) {
      return;
    }
    lastTracked.current = { path: location.pathname, at: now };
    api.trackEvent('page.open', { page }).catch(() => {
      /* ignore */
    });
  }, [location.pathname]);

  return (
    <div className="app">
      <Sidebar />
      <main className="app-main">
        <div className="app-topbar">
          <div />
          <UserMenu />
        </div>
        <ConfirmEmailBanner />
        <Routes>
          <Route
            path="/"
            element={
              <PageGuard flag="page.books">
                <BooksPage />
              </PageGuard>
            }
          />
          <Route
            path="/tabs/:tabId"
            element={
              <PageGuard flag="page.tabs">
                <TabPage />
              </PageGuard>
            }
          />
          <Route
            path="/categories"
            element={
              <PageGuard flag="page.categories">
                <CategoriesPage />
              </PageGuard>
            }
          />
          <Route
            path="/stats"
            element={
              <PageGuard flag="page.stats">
                <StatsPage />
              </PageGuard>
            }
          />
          <Route
            path="/plans"
            element={
              <PageGuard flag="page.plans">
                <PlansPage />
              </PageGuard>
            }
          />
          <Route
            path="/unread"
            element={
              <PageGuard flag="page.unread">
                <UnreadMonitoringPage />
              </PageGuard>
            }
          />
          <Route
            path="/read"
            element={
              <PageGuard flag="page.read">
                <ReadMonitoringPage />
              </PageGuard>
            }
          />
          <Route
            path="/costs"
            element={
              <PageGuard flag="page.costs">
                <CostPage />
              </PageGuard>
            }
          />
          <Route
            path="/about"
            element={
              <PageGuard flag="page.about">
                <AboutPage />
              </PageGuard>
            }
          />
          <Route
            path="/admin"
            element={
              authStore.isAdmin ? (
                <AdminPage />
              ) : (
                <Navigate to={flagsStore.fallbackPath()} replace />
              )
            }
          />
          <Route path="/locked" element={<LockedPage />} />
          <Route path="*" element={<Navigate to={flagsStore.fallbackPath()} replace />} />
        </Routes>
      </main>
      <TabEditorModal />
      {uiStore.backupsOpen && <BackupsModal />}
    </div>
  );
});

const App = observer(() => {
  useEffect(() => {
    authStore.init();
    flagsStore.init();
  }, []);

  if (!authStore.initialized) {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: 'center', padding: '48px 32px' }}>
          <div className="auth-icon">📚</div>
          <div style={{ marginTop: 16, color: 'var(--muted)' }}>Загрузка…</div>
        </div>
      </div>
    );
  }

  if (authStore.isAuthenticated) {
    return (
      <Routes>
        <Route
          path="/login"
          element={<Navigate to={flagsStore.fallbackPath()} replace />}
        />
        <Route
          path="/register"
          element={<Navigate to={flagsStore.fallbackPath()} replace />}
        />
        <Route path="*" element={<AppShell />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route
        path="/about"
        element={
          flagsStore.isEnabled('page.about') ? (
            <AboutPage />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/confirm-email" element={<ConfirmEmailPage />} />
      <Route
        path="*"
        element={
          <Navigate
            to={flagsStore.isEnabled('page.about') ? '/about' : '/login'}
            replace
          />
        }
      />
    </Routes>
  );
});

export default App;