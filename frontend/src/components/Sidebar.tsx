import { useState } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { rootStore } from '../stores/rootStore';
import { uiStore } from '../stores/uiStore';
import ConfirmDialog from './ConfirmDialog';
import type { Tab } from '../api/types';

const Sidebar = observer(() => {
  const { tabs } = rootStore;
  const navigate = useNavigate();
  const [deleteTarget, setDeleteTarget] = useState<Tab | null>(null);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    await tabs.remove(id);
    setDeleteTarget(null);
    if (location.pathname === `/tabs/${id}`) {
      navigate('/');
    }
  };

  return (
    <aside className="sidebar">
      <NavLink to="/" className="sidebar-brand">
        <span className="sidebar-brand-icon">📚</span>
        <span>
          <div className="sidebar-brand-title">Моя библиотека</div>
          <div className="sidebar-brand-sub">личный каталог книг</div>
        </span>
      </NavLink>

      <div className="sidebar-section">
        <div className="sidebar-section-label">Библиотека</div>
        <nav className="sidebar-nav">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">▤</span>
            <span>Все книги</span>
          </NavLink>
          <NavLink
            to="/stats"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">▥</span>
            <span>Статистика</span>
          </NavLink>
          <NavLink
            to="/plans"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">▦</span>
            <span>План покупок</span>
          </NavLink>
          <NavLink
            to="/unread"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">▧</span>
            <span>Мониторинг непрочитанного</span>
          </NavLink>
          <NavLink
            to="/read"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">▨</span>
            <span>Мониторинг прочитанного</span>
          </NavLink>
        </nav>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section-label">Табы</div>
        <nav className="sidebar-nav">
          {tabs.tabs.map((tab) => (
            <NavLink
              key={tab.id}
              to={`/tabs/${tab.id}`}
              className={({ isActive }) => `sidebar-link sidebar-link-tab ${isActive ? 'active' : ''}`}
            >
              <span className="nav-dot" />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                {tab.name}
              </span>
              <button
                className="sidebar-tab-delete"
                title="Удалить таб"
                onClick={(e) => { e.preventDefault(); setDeleteTarget(tab); }}
              >
                ✕
              </button>
            </NavLink>
          ))}
          <button className="sidebar-add" onClick={() => uiStore.openNewTab()}>
            <span className="sidebar-add-icon" />
            <span>Новый таб</span>
          </button>
        </nav>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section-label">Справочники</div>
        <nav className="sidebar-nav">
          <NavLink
            to="/categories"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">☰</span>
            <span>Категории и жанры</span>
          </NavLink>
        </nav>
      </div>

      <div className="sidebar-footer">
        <button
          className="sidebar-footer-btn"
          onClick={() => uiStore.openBackups()}
        >
          <span className="sidebar-footer-btn-icon">🗄</span>
          <span>Менеджмент версий</span>
        </button>
        <div style={{ marginTop: 8 }}>Where Is My Books · v1.0</div>
      </div>

      {deleteTarget && createPortal(
        <ConfirmDialog
          title="Удалить таб?"
          message={`Таб «${deleteTarget.name}» будет удалён безвозвратно.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />,
        document.body,
      )}
    </aside>
  );
});

export default Sidebar;
