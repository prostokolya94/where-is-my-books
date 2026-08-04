import { useState } from 'react';
import Modal from './Modal';

interface Props {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Удалить',
  onConfirm,
  onCancel,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
      onCancel();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось выполнить операцию');
      setBusy(false);
    }
  };

  return (
    <Modal
      title={title}
      onClose={onCancel}
      width={420}
      footer={
        <>
          <button className="btn btn-outline" onClick={onCancel} disabled={busy}>
            Отмена
          </button>
          <button className="btn btn-danger" onClick={handleConfirm} disabled={busy}>
            {busy ? 'Удаление…' : confirmLabel}
          </button>
        </>
      }
    >
      <p style={{ margin: '4px 0', fontSize: 14 }}>{message}</p>
      {error && <div className="error-banner" style={{ marginTop: 12 }}>{error}</div>}
    </Modal>
  );
}
