export enum BookStatus {
  READ = 'read',
  BOUGHT = 'bought',
  WISHLIST = 'wishlist',
}

export const BOOK_STATUS_LABELS: Record<BookStatus, string> = {
  [BookStatus.READ]: 'Прочитана',
  [BookStatus.BOUGHT]: 'Куплена, не прочитана',
  [BookStatus.WISHLIST]: 'В списке желаемого',
};
