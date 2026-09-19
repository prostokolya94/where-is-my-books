# Where Is My Books — инструкция: как запускать и как деплоить

Всё делается обычными командами из корня проекта (Windows PowerShell или Linux), простыми словами и по шагам.

---

# Часть 1. Запуск локально (для разработки и дебага)

## Что нужно установлено
- **Node.js** 20 или 22 (проверить: `node -v`)
- **PostgreSQL** (Windows: ставится как служба `postgresql-x64-18`, можно проверить в «services.msc»)

## Первый раз — поставить зависимости и настроить БД

1. Установить зависимости во всех трёх частях (корень, backend, frontend):
   ```
   npm run setup
   ```

2. Проверить, что база `books` существует. Откройте командную строку SQL:
   ```
   psql -U postgres
   ```
   и выполните (если базы ещё нет):
   ```sql
   CREATE DATABASE books;
   \q
   ```

3. В файле `backend\.env` должны быть рабочие доступы к БД:
   ```
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=postgres
   DB_NAME=books
   DB_SYNC=true
   ```
   `DB_SYNC=true` означает: таблицы создаются сами при первом запуске. Для локальной разработки это правильно.

## Запуск — одна команда

```
npm run dev
```

Что произойдёт автоматически:
1. Скрипт проверит PostgreSQL и, если он выключен, попробует запустить службу сам.
2. Запустится backend на `http://localhost:3001/api`.
3. Запустится frontend на `http://localhost:5173`.

Откройте в браузере: **http://localhost:5173**

Остановить разработку: нажмите `Ctrl+C` в окне, где запущен `npm run dev` (остановятся оба процесса).

### Если база не запустилась автоматически
- Windows: `services.msc` → найти `postgresql-x64-18` → «Запустить», затем снова `npm run dev`.
- Или пропустить проверку БД (полезно, если база где-то на другом адресе):
  ```
  set WIMB_SKIP_DB=1 && npm run dev
  ```

## Ещё полезные команды (локально)

| Команда | Что делает |
|---|---|
| `npm run dev:db` | Только проверить/поднять PostgreSQL |
| `npm run dev:backend` | Только backend (watch-режим) |
| `npm run dev:frontend` | Только frontend |
| `npm run build` | Собрать backend и frontend (для продакшена) |
| `npm run start` | Запустить собранный backend (`backend/.env` = конфиг) |
| `npm run preview` | Показать собранный frontend |
| `npm run start:prod` | Собрать и запустить, как «почти прод» локально |

Порядок для «прод-проверки» локально: сначала `npm run start` (в одном окне), потом `npm run preview` (в другом окне), зайти на `http://localhost:5173`.

---

# Часть 2. Развёртывание на сервере (первый раз, Ubuntu)

## Что понадобится
- Арендованный VPS с Ubuntu 22.04/24.04
- Домен, привязанный к IP сервера (A-запись)
- Доступ по SSH

## Шаг 1. Подготовить сервер (одноразово)

Зайти по SSH и выполнить по очереди:

```bash
# создать пользователя для приложения
sudo adduser deploy
sudo usermod -aG sudo deploy

# разрешить вход по ключу со своей машины (набрать на СВОЕЙ машине):
ssh-copy-id deploy@IP-СЕРВЕРА

# на сервере — выключить вход по паролю и root
sudo sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
sudo sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo systemctl restart ssh

# файрвол: закрыть всё, кроме SSH, HTTP, HTTPS
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# установить программы: Node.js 22, nginx, PostgreSQL, certbot
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt update
sudo apt -y install nodejs nginx postgresql postgresql-contrib certbot python3-certbot-nginx
```

## Шаг 2. Создать базу и пользователя БД

```bash
sudo -u postgres psql
```

Выполнить (пароль сгенерируйте сами):
```sql
CREATE ROLE wimb LOGIN PASSWORD 'СЛУЧАЙНЫЙ_ПАРОЛЬ_БД';
CREATE DATABASE books OWNER wimb;
\q
```

Проверка, что база не выходит за пределы сервера:
```bash
sudo ss -tlnp | grep 5432        # должно быть 127.0.0.1:5432, НЕ 0.0.0.0
```

## Шаг 3. Положить код на сервер и настроить секреты

```bash
sudo mkdir -p /srv/where-is-my-books
sudo chown deploy:deploy /srv/where-is-my-books
cd /srv/where-is-my-books
git clone ВАШ_РЕПОЗИТОРИЙ .
rm -f docker-compose.yml        # на сервере Postgres нативный, compose не нужен
```

Секреты — НЕ в коде и НЕ в репозитории, а в файле с правами только для пользователя `deploy`:

```bash
sudo mkdir -p /etc/wimb
# сгенерируйте случайные секреты:
JWT=$(openssl rand -base64 48)
DBPASS=$(openssl rand -base64 24)

# создайте конфиг из примера:
sudo cp /srv/where-is-my-books/backend/.env.example /etc/wimb/backend.env
sudo chown deploy:deploy /etc/wimb/backend.env
sudo chmod 600 /etc/wimb/backend.env
sudo nano /etc/wimb/backend.env
```

Заполните ключевые строки в `/etc/wimb/backend.env`:
```
NODE_ENV=production
HOST=127.0.0.1
DB_USER=wimb
DB_PASSWORD=<пароль из шага 2>
DB_SYNC=false
JWT_SECRET=<ваш сгенерированный JWT>
CORS_ORIGIN=https://ВАШ_ДОМЕН
MAIL_TRANSPORT=smtp
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=<логин почтового провайдера>
SMTP_PASS=<пароль почтового провайдера>
FRONTEND_URL=https://ВАШ_ДОМЕН
```

## Шаг 4. Собрать в первый раз и создать таблицы

```bash
cd /srv/where-is-my-books/backend
npm ci
npm run build
set -a; source /etc/wimb/backend.env; set +a
DB_SYNC=true timeout 15 node dist/main.js   # таблицы создадутся, через 15 с остановится сам
```

Дальше приложение всегда запускается с `DB_SYNC=false`.

## Шаг 5. Запустить backend как службу (systemd)

Создайте файл `/etc/systemd/system/wimb-backend.service`:

```ini
[Unit]
Description=Where Is My Books backend
After=network.target postgresql.service

[Service]
Type=simple
User=deploy
WorkingDirectory=/srv/where-is-my-books/backend
EnvironmentFile=/etc/wimb/backend.env
ExecStart=/usr/bin/node dist/main.js
Restart=always
RestartSec=3
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

Запустите:
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now wimb-backend
sudo systemctl status wimb-backend      # должно быть active
curl http://127.0.0.1:3001/api/health   # должно быть {"ok":true,...}
```

Журнал сервиса: `journalctl -u wimb-backend -f`

## Шаг 6. Разрешить перезапуск без пароля (нужно для скрипта деплоя)

```bash
echo "deploy ALL=(ALL) NOPASSWD: /bin/systemctl, /usr/bin/systemctl" | sudo tee /etc/sudoers.d/wimb-systemctl
```

## Шаг 7. nginx: фронтенд + прокси + HTTPS

Создайте `/etc/nginx/sites-available/wimb`:

```nginx
server {
    listen 80;
    server_name ВАШ_ДОМЕН;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ВАШ_ДОМЕН;

    root /srv/where-is-my-books/frontend/dist;
    index index.html;

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
        client_max_body_size 50m;
    }
}
```

Включить сайт:
```bash
sudo ln -s /etc/nginx/sites-available/wimb /etc/nginx/sites-enabled/wimb
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

Получить бесплатный HTTPS-сертификат:
```bash
sudo certbot --nginx -d ВАШ_ДОМЕН --redirect
```

## Шаг 8. Проверить, что всё работает

1. Откройте `https://ВАШ_ДОМЕН` — должна открыться страница «О проекте».
2. Зарегистрируйтесь — придёт письмо на почту, по ссылке подтвердится email.
3. Зайдите в логи: `journalctl -u wimb-backend -f` — нет ошибок.

---

# Часть 3. Обновление приложения одной командой (после первичной настройки)

Всё дальнейшее обновление — на вашей машине, одной командой.

## Один раз: настроить файл деплоя

Скопируйте пример и отредактируйте:

```
copy deploy.config.example.json deploy.config.json    # (Windows)
cp deploy.config.example.json deploy.config.json      # (Linux)
```

В `deploy.config.json` заполните:
```json
{
  "host": "IP_ИЛИ_ДОМЕН_СЕРВЕРА",   // обязательное поле
  "user": "deploy",                  // пользователь с шага 1 (Часть 2)
  "sshPort": 22
}
```
Остальные поля править не нужно. Файл `deploy.config.json` в git не попадает (он в `.gitignore`).

## Запуск деплоя

```
npm run deploy
```

Что сделает скрипт по очереди (и покажет в консоли):
1. Соберёт backend и frontend на вашей машине.
2. Упакует исходники в архив (без `node_modules`, `dist`, `.env`).
3. Загрузит архив на сервер.
4. На сервере: установит зависимости → соберёт → перезапустит службу `wimb-backend`.
5. Проверит `/api/health`.

Готово — новая версия на сервере.

## Другие полезные команды
| Команда | Что делает |
|---|---|
| `npm run deploy:dry` | Только собрать и показать план (ничего не отправляет) |
| `npm run deploy:fast` | Деплой без локальной сборки (если уверены) |

## Если что-то не так с деплоем
- SSH не подключается → проверьте `host`/`user` в `deploy.config.json` и что ключ добавлен (`ssh-copy-id`).
- «Не удалось перезапустить сервис» → на сервере выполните шаг 6 (команду `sudoers.d`).
- «Каталог недоступен» → проверьте права: `sudo chown deploy:deploy /srv/where-is-my-books`.

---

# Часть 4. Резервное копирование (обязательно после запуска)

Вся база (вместе с версиями книг) живёт в PostgreSQL. Ежедневный дамп — страховка:

```bash
sudo mkdir -p /var/backups/wimb
sudo tee /usr/local/bin/wimb-backup.sh > /dev/null <<'EOF'
#!/bin/bash
set -e
source /etc/wimb/backend.env
STAMP=$(date +%F_%H%M)
pg_dump --dbname=postgresql://wimb:$DB_PASSWORD@127.0.0.1:5432/books \
  -F c -f /var/backups/wimb/books_$STAMP.dump
find /var/backups/wimb -name '*.dump' -mtime +14 -delete
EOF
sudo chmod 700 /usr/local/bin/wimb-backup.sh
sudo crontab -e
# добавьте строку:
# 30 3 * * * /usr/local/bin/wimb-backup.sh
```

Проверка восстановления из дампа:
```bash
sudo -u postgres createdb books_test
pg_restore -U wimb -h 127.0.0.1 -d books_test /var/backups/wimb/books_XXX.dump
```

Обязательно увозить дампы с сервера (раз в неделю): `rclone`, `scp` или облачное хранилище.

---

# Часть 5. Наблюдение и безопасность

## Смотреть за состоянием
```bash
systemctl status wimb-backend
journalctl -u wimb-backend -f      # логи бэкенда
df -h                              # диск
du -sh /var/backups/wimb           # размер бэкапов
```
Простой авто-рестарт при падении: каждые 5 минут проверять health и перезапускать:
```bash
sudo crontab -e
# */5 * * * * curl -fsS http://127.0.0.1:3001/api/health >/dev/null 2>&1 || systemctl restart wimb-backend
```

## Чеклист безопасности (пройти после первичного деплоя)
- [ ] `sudo ufw status` → открыты только 22, 80, 443, остальное закрыто
- [ ] Вход по SSH только по ключу, `deploy` вместо root
- [ ] PostgreSQL слушает только `127.0.0.1:5432`
- [ ] `JWT_SECRET` случайный, живёт в `/etc/wimb/backend.env` с правами 600
- [ ] `DB_SYNC=false`, `HOST=127.0.0.1` в `/etc/wimb/backend.env`
- [ ] `CORS_ORIGIN=https://ВАШ_ДОМЕН`
- [ ] HTTPS работает, `sudo certbot renew --dry-run` без ошибок
- [ ] `curl http://127.0.0.1:3001/api/health` → ok
- [ ] Бэкап создаётся: в `/var/backups/wimb` свежие `.dump`
- [ ] Дамп уезжает за пределы сервера

## Откуда берутся пароли (просто и безопасно)
- **Локально** — файл `backend/.env` (он в `.gitignore`, в репозиторий не попадает).
- **На сервере** — файл `/etc/wimb/backend.env` (права 600, читает только пользователь `deploy`).
- **В коммиты секреты не попадают**: `.env`, `deploy.config.json` исключены через `.gitignore`.
- Никогда не вставляйте пароли прямо в код или в сообщения.

---

# Приложение: структура проекта

```
where-is-my-books/
├── backend/          # NestJS-API (порт 3001), конфиг в backend/.env
├── frontend/         # React/Vite (порт 5173), ходит на относительный /api
├── scripts/          # скрипты: dev-db.mjs (БД), deploy.mjs (деплой)
├── deploy.config.example.json   # шаблон конфига деплоя
└── package.json      # команды: setup / dev / build / start / deploy
```