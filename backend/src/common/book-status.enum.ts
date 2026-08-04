export enum BookStatus {
  READ = 'read',
  BOUGHT = 'bought',
  WISHLIST = 'wishlist',
  ABANDONED = 'abandoned',
}

export const BOOK_STATUS_LABELS: Record<BookStatus, string> = {
  [BookStatus.READ]: 'Прочитана',
  [BookStatus.BOUGHT]: 'Куплена, не прочитана',
  [BookStatus.WISHLIST]: 'В списке желаемого',
  [BookStatus.ABANDONED]: 'Брошена',
};
