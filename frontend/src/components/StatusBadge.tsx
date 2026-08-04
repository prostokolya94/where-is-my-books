import { BOOK_STATUS_LABELS, type BookStatus } from '../api/types';

interface Props {
  status: BookStatus;
}

export default function StatusBadge({ status }: Props) {
  return <span className={`badge badge-${status}`}>{BOOK_STATUS_LABELS[status]}</span>;
}
