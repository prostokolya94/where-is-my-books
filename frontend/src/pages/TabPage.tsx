import { useParams } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import BookListView from '../components/BookListView';
import { rootStore } from '../stores/rootStore';
import { BOOK_STATUS_LABELS, type TabFilters } from '../api/types';

const describeFilters = (filters: TabFilters, catalog: typeof rootStore.catalog): string => {
  const parts: string[] = [];
  if (filters.categories.length) {
    parts.push(
      `категории: ${filters.categories.map((id) => catalog.categoryById.get(id)?.name ?? `#${id}`).join(', ')}`,
    );
  }
  if (filters.genres.length) {
    parts.push(
      `жанры: ${filters.genres.map((id) => catalog.genreById.get(id)?.name ?? `#${id}`).join(', ')}`,
    );
  }
  if (filters.statuses.length) {
    parts.push(`статус: ${filters.statuses.map((s) => BOOK_STATUS_LABELS[s as keyof typeof BOOK_STATUS_LABELS]).join(', ')}`);
  }
  if (filters.search.trim()) {
    parts.push(`поиск: «${filters.search.trim()}»`);
  }
  return parts.length ? `Подборка по пресету: ${parts.join(' · ')}` : 'Подборка по пресету без фильтров — все книги';
};

const TabPage = observer(() => {
  const { tabId } = useParams<{ tabId: string }>();
  const { tabs, catalog } = rootStore;

  const tab = tabs.tabs.find((t) => t.id === Number(tabId));

  if (!tab) {
    return (
      <div className="page">
        <div className="loading-bar">Таб не найден или ещё загружается…</div>
      </div>
    );
  }

  return (
    <BookListView
      key={tab.id}
      title={tab.name}
      subtitle={describeFilters(tab.filters, catalog)}
      initialFilters={tab.filters}
      showSavePreset
      onSavePreset={(filters) => tabs.update(tab.id, { filters })}
    />
  );
});

export default TabPage;
