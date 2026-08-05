import { NavLink } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { rootStore } from '../stores/rootStore';
import { uiStore } from '../stores/uiStore';

const Sidebar = observer(() => {
  const { tabs } = rootStore;

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
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {tab.name}
              </span>
            </NavLink>
          ))}
          <button className="sidebar-add" onClick={() => uiStore.openNewTab()}>
            <span className="sidebar-add-icon">+</span>
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

      <div className="sidebar-footer">Where Is My Books · v1.0</div>
    </aside>
  );
});

export default Sidebar;
