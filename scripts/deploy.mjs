/**
 * deploy.mjs — деплой одной командой:  npm run deploy
 *
 * Что делает:
 *   1. Собирает backend и frontend локально (или пропустите: --skip-build).
 *   2. Упаковывает исходники в tar.gz (без node_modules/dist/.git/.env).
 *   3. Загружает архив на сервер по scp.
 *   4. На сервере: распаковка → npm ci → сборка → restart systemd-сервиса.
 *   5. Проверяет /api/health.
 *
 * Конфигурация: файл deploy.config.json (скопируйте из deploy.config.example.json
 * и подставьте адрес/пользователя). Секреты НЕ трогаются: на сервере они живут
 * в /etc/wimb/backend.env и не участвуют в деплое.
 *
 * Флаги:
 *   node scripts/deploy.mjs --skip-build   — не собирать локально
 *   node scripts/deploy.mjs --dry-run      — только упаковать и показать план
 *                                            (проверка без сервера)
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const CONFIG_FILE = path.join(ROOT, 'deploy.config.json');
const CONFIG_EXAMPLE = path.join(ROOT, 'deploy.config.example.json');

const args = process.argv.slice(2);
const SKIP_BUILD = args.includes('--skip-build');
const DRY_RUN = args.includes('--dry-run');

function fail(msg) {
  console.error(`\n[deploy] ERROR: ${msg}`);
  process.exit(1);
}

function loadConfig() {
  if (!fs.existsSync(CONFIG_FILE)) {
    console.error(
      `\n[deploy] Файл конфигурации не найден: ${CONFIG_FILE}\n` +
        `[deploy] Скопируйте пример и подставьте адрес сервера:\n` +
        `[deploy]   (Windows)  copy deploy.config.example.json deploy.config.json\n` +
        `[deploy]   (Linux)    cp deploy.config.example.json deploy.config.json\n`,
    );
    process.exit(1);
  }
  let cfg;
  try {
    cfg = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
  } catch {
    fail(`Не удалось прочитать ${CONFIG_FILE} (проверьте JSON)`);
  }
  if (!cfg.host || cfg.host === 'SERVER_IP_OR_DOMAIN') {
    fail('В deploy.config.json не заполнен "host" — вставьте IP или домен сервера');
  }
  return {
    host: cfg.host,
    user: cfg.user || 'deploy',
    sshPort: Number(cfg.sshPort || 22),
    remoteDir: cfg.remoteDir || '/srv/where-is-my-books',
    backendService: cfg.backendService || 'wimb-backend',
    healthUrl: cfg.healthUrl || 'http://127.0.0.1:3001/api/health',
    key: cfg.key || '',
  };
}

const cfg = loadConfig();
const DEST = `${cfg.user}@${cfg.host}`;
const SSH_ARGS = [
  '-o',
  'BatchMode=yes',
  '-o',
  'ConnectTimeout=10',
  '-o',
  'StrictHostKeyChecking=accept-new',
  `-p ${cfg.sshPort}`,
  ...(cfg.key ? ['-i', cfg.key] : []),
];
const SCP_ARGS = [
  '-o',
  'BatchMode=yes',
  `-P ${cfg.sshPort}`,
  ...(cfg.key ? ['-i', cfg.key] : []),
];

function run(cmd, cmdArgs, opts = {}) {
  console.log(`\n$ ${cmd} ${cmdArgs.join(' ')}`);
  const r = spawnSync(cmd, cmdArgs, { stdio: 'inherit', cwd: opts.cwd });
  if (r.status !== 0) {
    const hint = r.error ? ` (${r.error.message})` : '';
    fail(`Команда завершилась с ошибкой (код ${r.status})${hint}: ${cmd}`);
  }
}

function npmRun(npmArgs, cwd) {
  const full = `npm ${npmArgs.join(' ')}`;
  console.log(`\n$ ${full}`);
  const r = spawnSync(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', full], {
    stdio: 'inherit',
    cwd,
  });
  if (r.status !== 0) {
    const hint = r.error ? ` (${r.error.message})` : '';
    fail(`npm завершился с ошибкой (код ${r.status})${hint}: ${full}`);
  }
}

function ssh(cmdStr) {
  const r = spawnSync('ssh', [...SSH_ARGS, DEST, cmdStr], { encoding: 'utf8' });
  if (r.status !== 0) fail(`SSH-команда упала (код ${r.status}).\n${r.stderr || r.stdout}`);
  return r;
}

function buildLocally() {
  console.log('\n=== [1/5] Локальная сборка ===');
  npmRun(['--prefix', 'backend', 'run', 'build'], ROOT);
  npmRun(['--prefix', 'frontend', 'run', 'build'], ROOT);
}

function createArchive() {
  console.log('\n=== [2/5] Упаковка исходников ===');
  const tgz = path.join(os.tmpdir(), `wimb-deploy-${Date.now()}.tgz`);
  const excludes = [
    '--exclude=node_modules',
    '--exclude=dist',
    '--exclude=.git',
    '--exclude=.env',
    '--exclude=*.log',
    '--exclude=backend/data',
    '--exclude=deploy.config.json',
  ];
  const r = spawnSync('tar', ['-czf', tgz, ...excludes, 'package.json', 'scripts', 'backend', 'frontend'], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  if (r.status !== 0) fail(`Не удалось создать архив:\n${r.stderr}`);
  const sizeKB = Math.round(fs.statSync(tgz).size / 1024);
  console.log(`[deploy] Архив готов: ${tgz} (${sizeKB} КБ)`);
  return tgz;
}

function sudoHint() {
  return (
    '[deploy] Чтобы restart не спрашивал пароль, выполните на сервере ОДИН раз:\n' +
    '[deploy]   echo "deploy ALL=(ALL) NOPASSWD: /bin/systemctl, /usr/bin/systemctl" | sudo tee /etc/sudoers.d/wimb-systemctl'
  );
}

function remoteSteps() {
  return [
    `mkdir -p ${cfg.remoteDir}`,
    `tar -xzf /tmp/wimb-deploy.tgz -C ${cfg.remoteDir}`,
    `cd ${cfg.remoteDir}/backend  && rm -rf dist && npm ci --no-audit --no-fund && npm run build && npm prune --omit=dev`,
    `cd ${cfg.remoteDir}/frontend && rm -rf dist && npm ci --no-audit --no-fund && npm run build`,
    `sudo systemctl restart ${cfg.backendService}`,
    `for i in $(seq 1 15); do curl -fsS ${cfg.healthUrl} >/dev/null 2>&1 && exit 0; sleep 1; done; exit 1`,
  ];
}

function deployRemote(tgz) {
  console.log('\n=== [3/5] Загрузка на сервер ===');
  run('scp', [...SCP_ARGS, tgz, `${DEST}:/tmp/wimb-deploy.tgz`]);

  console.log('\n=== [4/5] Сборка на сервере ===');
  ssh(remoteSteps().slice(0, 4).join(' && '));

  console.log('\n=== [5/5] Рестарт и проверка здоровья ===');
  try {
    ssh(`sudo systemctl restart ${cfg.backendService}`);
  } catch {
    console.error(sudoHint());
    fail(`Не удалось перезапустить ${cfg.backendService}`);
  }
  try {
    ssh(remoteSteps()[5]);
  } catch {
    fail(`Бэкенд не ответил на ${cfg.healthUrl} за 15 секунд`);
  }
  console.log(`\n[deploy] Готово. Приложение обновлено на ${cfg.host}`);
}

console.log(`\n[deploy] Хост: ${cfg.host}  Пользователь: ${cfg.user}  Каталог: ${cfg.remoteDir}`);
console.log(`[deploy] Сборка локально: ${SKIP_BUILD ? 'пропущена' : 'да'}  Dry-run: ${DRY_RUN ? 'да' : 'нет'}`);

if (!SKIP_BUILD) buildLocally();
const tgz = createArchive();

if (DRY_RUN) {
  console.log('\n[deploy] === DRY-RUN: план команд на сервере (ничего не выполнено) ===');
  remoteSteps().forEach((s, i) => console.log(`  ${i + 1}) ${s}`));
  console.log('\n' + sudoHint());
  fs.rmSync(tgz, { force: true });
  console.log('\n[deploy] Архив удалён, всё в порядке. Заполните deploy.config.json и запустите: npm run deploy');
  process.exit(0);
}

deployRemote(tgz);
fs.rmSync(tgz, { force: true });