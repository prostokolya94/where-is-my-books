import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { rootStore } from './stores/rootStore';
import Sidebar from './components/Sidebar';
import BooksPage from './pages/BooksPage';
import TabPage from './pages/TabPage';
import CategoriesPage from './pages/CategoriesPage';
import StatsPage from './pages/StatsPage';
import PlansPage from './pages/PlansPage';
import UnreadMonitoringPage from './pages/UnreadMonitoringPage';
import ReadMonitoringPage from './pages/ReadMonitoringPage';
import TabEditorModal from './components/TabEditorModal';
import BackupsModal from './components/BackupsModal';
import { uiStore } from './stores/uiStore';

const App = observer(() => {
  useEffect(() => {
    rootStore.init();
  }, []);

  return (
    <div className="app">
      <Sidebar />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<BooksPage />} />
          <Route path="/tabs/:tabId" element={<TabPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/plans" element={<PlansPage />} />
          <Route path="/unread" element={<UnreadMonitoringPage />} />
          <Route path="/read" element={<ReadMonitoringPage />} />
        </Routes>
      </main>
      <TabEditorModal />
      {uiStore.backupsOpen && <BackupsModal />}
    </div>
  );
});

export default App;
