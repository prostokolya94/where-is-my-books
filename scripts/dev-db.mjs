/**
 * dev-db.mjs — «поднять базу перед локальной разработкой».
 *
 * Логика:
 *  1) Если PostgreSQL уже отвечает на 127.0.0.1:5432 — ничего не делает.
 *  2) Если нет — пытается стартовать системный сервис PostgreSQL:
 *       - Windows : net start postgresql-x64-XX
 *       - Linux   : systemctl/service
 *       - macOS   : brew services
 *  3) Ждёт готовность до 15 секунд, иначе — понятная ошибка.
 *
 * Escape-hatch: WIMB_SKIP_DB=1 npm run dev
 */
import { spawnSync } from 'node:child_process';
import net from 'node:net';

const PORT = Number(process.env.DB_PORT || process.env.PGPORT || 5432);
const HOST = '127.0.0.1';
const WAIT_TRIES = 30;
const WAIT_INTERVAL_MS = 500;

function isReachable(timeoutMs = 1200) {
  return new Promise((resolve) => {
    const sock = new net.Socket();
    const done = (ok) => {
      sock.destroy();
      resolve(ok);
    };
    sock.setTimeout(timeoutMs);
    sock.once('connect', () => done(true));
    sock.once('timeout', () => done(false));
    sock.once('error', () => done(false));
    sock.connect(PORT, HOST);
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function run(cmd, args) {
  return spawnSync(cmd, args, { encoding: 'utf8', shell: process.platform === 'win32' });
}

function windowsServiceNames() {
  return [
    'postgresql-x64-18',
    'postgresql-x64-17',
    'postgresql-x64-16',
    'postgresql-18',
    'postgresql-17',
    'postgresql-16',
    'postgresql',
  ];
}

function startService() {
  if (process.platform === 'win32') {
    for (const name of windowsServiceNames()) {
      const q = run('sc.exe', ['query', name]);
      // Служба не существует → пробуем следующее имя
      if (q.status !== 0 || !q.stdout) continue;
      const state = /STATE\s*:\s*(\d+)/.exec(q.stdout);
      // 1 = STOPPED, 2 = START_PENDING, 3 = STOP_PENDING, 4 = RUNNING
      if (state && Number(state[1]) !== 1) {
        return { ok: true, message: `PostgreSQL уже запущен (${name})` };
      }
      const s = run('net.exe', ['start', name]);
      if (s.status === 0) {
        return { ok: true, message: `PostgreSQL запущен (net start ${name})` };
      }
    }
    return { ok: false };
  }

  if (process.platform === 'linux') {
    const attempts = [
      ['systemctl', ['start', 'postgresql']],
      ['service', ['postgresql', 'start']],
    ];
    for (const [cmd, args] of attempts) {
      const s = run(cmd, args);
      if (s.status === 0) {
        return { ok: true, message: `PostgreSQL запущен (${cmd} ${args.join(' ')})` };
      }
    }
    return { ok: false };
  }

  if (process.platform === 'darwin') {
    const s = run('brew', ['services', 'start', 'postgresql@16']);
    if (s.status === 0) {
      return { ok: true, message: 'PostgreSQL запущен (brew services start postgresql@16)' };
    }
    return { ok: false };
  }

  return { ok: false };
}

function manualHint() {
  const lines = ['[db] Не удалось поднять PostgreSQL автоматически.'];
  if (process.platform === 'win32') {
    lines.push('[db] Windows: services.msc → служба "postgresql-x64-18" → Пуск');
    lines.push('[db]   или из консоли:  net start postgresql-x64-18');
  } else if (process.platform === 'linux') {
    lines.push('[db] Linux:  sudo systemctl start postgresql');
  } else if (process.platform === 'darwin') {
    lines.push('[db] macOS:  brew services start postgresql');
  }
  lines.push('[db] Запустить без проверки БД:  (Windows) set WIMB_SKIP_DB=1 && npm run dev');
  return lines;
}

async function main() {
  if (process.env.WIMB_SKIP_DB === '1') {
    console.log('[db] Пропуск проверки БД (WIMB_SKIP_DB=1)');
    process.exit(0);
  }

  if (await isReachable()) {
    console.log(`[db] PostgreSQL уже отвечает на ${HOST}:${PORT}`);
    process.exit(0);
  }

  console.log(`[db] PostgreSQL не отвечает на ${HOST}:${PORT}. Пытаюсь запустить службу…`);
  const started = startService();
  if (started.ok) {
    for (let i = 0; i < WAIT_TRIES; i++) {
      await sleep(WAIT_INTERVAL_MS);
      if (await isReachable()) {
        console.log(`[db] ${started.message}. Готово.`);
        process.exit(0);
      }
    }
  }

  console.error(manualHint().join('\n'));
  process.exit(1);
}

await main();