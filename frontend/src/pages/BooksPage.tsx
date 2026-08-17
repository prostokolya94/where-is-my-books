import { useSearchParams } from 'react-router-dom';
import BookListView from '../components/BookListView';
import { EMPTY_TAB_FILTERS } from '../api/types';

export default function BooksPage() {
  const [searchParams] = useSearchParams();
  const genreParam = searchParams.get('genre');
  const genreId = genreParam ? Number(genreParam) : NaN;
  const hasGenre = Number.isInteger(genreId) && genreId > 0;

  const initialFilters = hasGenre
    ? { ...EMPTY_TAB_FILTERS, genres: [genreId] }
    : undefined;

  return (
    <BookListView
      key={hasGenre ? genreId : 'all'}
      title="Все книги"
      subtitle="Полный каталог — с фильтрами по категориям, жанрам и статусам"
      initialFilters={initialFilters}
    />
  );
}