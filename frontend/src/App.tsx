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
import TabEditorModal from './components/TabEditorModal';

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
        </Routes>
      </main>
      <TabEditorModal />
    </div>
  );
});

export default App;
