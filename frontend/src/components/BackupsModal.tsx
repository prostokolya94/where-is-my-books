import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import Modal from './Modal';
import ConfirmDialog from './ConfirmDialog';
import { rootStore } from '../stores/rootStore';
import { uiStore } from '../stores/uiStore';
import { backupsStore } from '../stores/backupsStore';

type Action =
  | { kind: 'create' }
  | { kind: 'apply'; name: string }
  | { kind: 'delete'; name: string };

function formatSize(size: number): string {
  if (size < 1024) return `${size} Б`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} КБ`;
  return `${(size / (1024 * 1024)).toFixed(1)} МБ`;
}

function formatCreated(createdAt: string): string {
  return createdAt.replace('_', ' ');
}

const BackupsModal = observer(() => {
  const [confirm, setConfirm] = useState<Action | null>(null);

  useEffect(() => {
    backupsStore.load();
  }, []);

  const store = backupsStore;
  const oldest = store.backups[0];

  const handleClose = () => {
    uiStore.closeBackups();
  };

  const confirmProps: Record<Action['kind'], { title: string; message: string; label: string }> = {
    create: {
      title: 'Создать резервную копию?',
      message: `Сейчас хранится ${store.backups.length} копии. Новая копия станет 4-й, поэтому самая старая копия «${oldest?.name}» будет удалена.`,
      label: 'Создать',
    },
    apply: {
      title: 'Применить резервную копию?',
      message: `Применение копии «${confirm?.kind === 'apply' ? confirm.name : ''}» полностью затрёт текущее состояние базы данных. Это действие нельзя отменить. Продолжить?`,
      label: 'Применить',
    },
    delete: {
      title: 'Удалить копию?',
      message: `Копия «${confirm?.kind === 'delete' ? confirm.name : ''}» будет удалена безвозвратно.`,
      label: 'Удалить',
    },
  };

  return (
    <Modal
      title="Менеджмент версий"
      onClose={handleClose}
      width={520}
      className="modal-tall"
      footer={
        <>
          <button
            className="btn btn-primary"
            onClick={() => {
              if (store.backups.length >= 3) {
                setConfirm({ kind: 'create' });
              } else {
                store.create();
              }
            }}
            disabled={store.busy || store.loading}
          >
            {store.busy ? 'Работаем…' : '+ Создать резервную копию'}
          </button>
          <button className="btn btn-outline" onClick={handleClose}>
            Закрыть
          </button>
        </>
      }
    >
      <p style={{ margin: '0 0 14px', fontSize: 13.5, color: 'var(--muted)' }}>
        Хранится не более 3 копий. Новую копию можно создавать не чаще одного раза в сутки.
        При создании 4-й копии самая старая будет удалена.
      </p>

      {store.loading ? (
        <div className="loading-bar">Загрузка…</div>
      ) : store.backups.length === 0 ? (
        <div className="empty-state" style={{ padding: '32px 20px' }}>
          <div className="empty-state-icon">🗄</div>
          <div className="empty-state-title">Копий пока нет</div>
          <div className="empty-state-text">
            Создайте первую резервную копию базы данных.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {store.backups.map((backup) => (
            <div
              key={backup.name}
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
                  {backup.name}
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                  {formatCreated(backup.createdAt)} · {formatSize(backup.size)}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => setConfirm({ kind: 'apply', name: backup.name })}
                  disabled={store.busy}
                >
                  Применить
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => setConfirm({ kind: 'delete', name: backup.name })}
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
              await store.apply(confirm.name);
              if (!store.error) {
                await rootStore.init();
                await rootStore.books.load();
              }
            }
            if (confirm.kind === 'delete') await store.remove(confirm.name);
          }}
          onCancel={() => setConfirm(null)}
        />
      )}
    </Modal>
  );
});

export default BackupsModal;