export interface FlagDef {
  key: string;
  label: string;
}

export const FLAG_DEFS: FlagDef[] = [
  { key: 'page.books', label: 'Все книги' },
  { key: 'page.stats', label: 'Статистика' },
  { key: 'page.plans', label: 'План покупок' },
  { key: 'page.unread', label: 'Мониторинг непрочитанного' },
  { key: 'page.read', label: 'Мониторинг прочитанного' },
  { key: 'page.costs', label: 'Стоимость библиотеки' },
  { key: 'page.categories', label: 'Категории и жанры' },
  { key: 'page.tabs', label: 'Вкладки (табы)' },
  { key: 'page.backups', label: 'Менеджмент версий' },
  { key: 'page.about', label: 'О проекте' },
];

export function isKnownFlag(name: string): boolean {
  return FLAG_DEFS.some((def) => def.key === name);
}