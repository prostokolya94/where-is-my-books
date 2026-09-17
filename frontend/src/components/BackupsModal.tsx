import { useEffect, useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import Modal from './Modal';
import ConfirmDialog from './ConfirmDialog';
import { rootStore } from '../stores/rootStore';
import { uiStore } from '../stores/uiStore';
import { dumpsStore } from '../stores/dumpsStore';
import { authStore } from '../stores/authStore';

type Action =
  | { kind: 'create' }
  | { kind: 'apply'; id: number }
  | { kind: 'delete'; id: number };

function formatSize(size: number): string {
  if (size < 1024) return `${size} Б`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} КБ`;
  return `${(size / (1024 * 1024)).toFixed(1)} МБ`;
}

function formatCreated(createdAt: string): string {
  try {
    const d = new Date(createdAt);
    return d.toLocaleString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return createdAt;
  }
}

const BackupsModal = observer(() => {
  const [confirm, setConfirm] = useState<Action | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canUpload = authStore.user?.canDownloadHisOwnDataBase ?? false;

  useEffect(() => {
    dumpsStore.load();
  }, []);

  const store = dumpsStore;
  const canDownload = canUpload;
  const oldest = store.dumps[store.dumps.length - 1];

  const handleClose = () => {
    uiStore.closeBackups();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      store.upload(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const confirmProps: Record<Action['kind'], { title: string; message: string; label: string }> = {
    create: {
      title: 'Создать личную версию?',
      message: `Сейчас хранится ${store.dumps.length} версий. При создании следующей самая старая «${oldest?.name}» будет удалена.`,
      label: 'Создать',
    },
    apply: {
      title: 'Применить личную версию?',
      message: 'Применение версии полностью заменит ваши текущие данные. Это действие нельзя отменить. Продолжить?',
      label: 'Применить',
    },
    delete: {
      title: 'Удалить личную версию?',
      message: 'Версия будет удалена безвозвратно.',
      label: 'Удалить',
    },
  };

  return (
    <Modal
      title="Менеджмент версий"
      onClose={handleClose}
      width={560}
      className="modal-tall"
      footer={
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary"
            onClick={() => {
              if (store.dumps.length >= 3) {
                setConfirm({ kind: 'create' });
              } else {
                store.create();
              }
            }}
            disabled={store.busy || store.loading}
          >
            {store.busy ? 'Работаем…' : '+ Создать версию'}
          </button>
          {canUpload && (
            <>
              <button
                className="btn btn-outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={store.busy}
              >
                Загрузить файл
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".sqlite"
                style={{ display: 'none' }}
                onChange={handleFileSelect}
              />
            </>
          )}
          <button className="btn btn-outline" onClick={handleClose}>
            Закрыть
          </button>
        </div>
      }
    >
      <p style={{ margin: '0 0 14px', fontSize: 13.5, color: 'var(--muted)' }}>
        Личные версии — это полные снимки вашей библиотеки. Хранится не более 3.
        Новую версию можно создавать не чаще раза в сутки.
      </p>

      {store.loading ? (
        <div className="loading-bar">Загрузка…</div>
      ) : store.dumps.length === 0 ? (
        <div className="empty-state" style={{ padding: '32px 20px' }}>
          <div className="empty-state-icon">🗄</div>
          <div className="empty-state-title">Версий пока нет</div>
          <div className="empty-state-text">
            Создайте первую личную версию базы данных.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {store.dumps.map((dump) => (
            <div
              key={dump.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 14px',
                border: '1px solid var(--line)',
                borderRadius: 12,
                background: 'var(--surface-soft)',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: "'Consolas', ui-monospace, monospace",
                    fontSize: 13,
                    color: 'var(--ink)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {dump.name}
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                  {formatCreated(dump.createdAt)} · {formatSize(dump.size)}
                  {dump.source === 'upload' && (
                    <span style={{ marginLeft: 6, color: 'var(--teal)' }}>
                      загружен
                    </span>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                {canDownload && (
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => store.download(dump.id)}
                    disabled={store.busy}
                  >
                    Скачать
                  </button>
                )}
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => setConfirm({ kind: 'apply', id: dump.id })}
                  disabled={store.busy}
                >
                  Применить
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => setConfirm({ kind: 'delete', id: dump.id })}
                  disabled={store.busy}
                >
                  Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {store.notice && !store.error && (
        <div
          style={{
            marginTop: 14,
            padding: '10px 14px',
            borderRadius: 10,
            fontSize: 13,
            background: 'rgba(31, 74, 65, 0.12)',
            color: 'var(--pine)',
          }}
        >
          {store.notice}
        </div>
      )}
      {store.error && (
        <div className="error-banner" style={{ marginTop: 14 }}>
          {store.error}
        </div>
      )}

      {confirm && (
        <ConfirmDialog
          title={confirmProps[confirm.kind].title}
          message={confirmProps[confirm.kind].message}
          confirmLabel={confirmProps[confirm.kind].label}
          onConfirm={async () => {
            if (confirm.kind === 'create') await store.create();
            if (confirm.kind === 'apply') {
              await store.apply(confirm.id);
              if (!store.error) {
                await rootStore.init();
                await rootStore.books.load();
              }
            }
            if (confirm.kind === 'delete') await store.remove(confirm.id);
          }}
          onCancel={() => setConfirm(null)}
        />
      )}
    </Modal>
  );
});

export default BackupsModal;