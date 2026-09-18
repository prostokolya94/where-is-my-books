import { useEffect, useRef } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { rootStore } from './stores/rootStore';
import { authStore } from './stores/authStore';
import { api } from './api/client';
import Sidebar from './components/Sidebar';
import UserMenu from './components/UserMenu';
import BooksPage from './pages/BooksPage';
import TabPage from './pages/TabPage';
import CategoriesPage from './pages/CategoriesPage';
import StatsPage from './pages/StatsPage';
import PlansPage from './pages/PlansPage';
import UnreadMonitoringPage from './pages/UnreadMonitoringPage';
import ReadMonitoringPage from './pages/ReadMonitoringPage';
import CostPage from './pages/CostPage';
import AdminPage from './pages/AdminPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
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
        <Routes>
          <Route path="/" element={<BooksPage />} />
          <Route path="/tabs/:tabId" element={<TabPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/plans" element={<PlansPage />} />
          <Route path="/unread" element={<UnreadMonitoringPage />} />
          <Route path="/read" element={<ReadMonitoringPage />} />
          <Route path="/costs" element={<CostPage />} />
          <Route
            path="/admin"
            element={authStore.isAdmin ? <AdminPage /> : <Navigate to="/" replace />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
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
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="/register" element={<Navigate to="/" replace />} />
        <Route path="*" element={<AppShell />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
});

export default App;