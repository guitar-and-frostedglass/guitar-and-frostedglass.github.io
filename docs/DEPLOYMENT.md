# Deployment Guide

## Quick Reference

| What | Where |
|------|-------|
| Prod API | `https://gfg-api.duckdns.org/api/*` |
| Dev API | `https://gfg-api.duckdns.org/dev-api/*` |
| Frontend | `https://guitar-and-frostedglass.github.io/` |
| Server | Oracle Cloud VM `129.153.195.31` (SSH via bastion) |
| DNS | `gfg-api.duckdns.org` on DuckDNS |
| SSL cert | Let's Encrypt, auto-renews via certbot timer |

---

## Everyday Operations

### Start everything after a reboot

Docker containers have `restart: unless-stopped`, so they auto-start. If they don't:

```bash
cd ~/guitar-and-frostedglass-dev/backend
docker compose -f docker-compose.prod.yml up -d
```

Nginx also auto-starts. If it doesn't:

```bash
sudo systemctl start nginx
```

### Check status

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs --tail 20 api-prod
docker compose -f docker-compose.prod.yml logs --tail 20 api-dev
sudo systemctl status nginx
```

### Deploy a code update

If the update includes **schema changes** (new migration files in `prisma/migrations/`), the API containers will crash-loop until the migration is applied. Use `run --rm` (not `exec`) to run migrations against crashing containers:

```bash
cd ~/guitar-and-frostedglass-dev
git pull
cd backend

# Rebuild images
docker compose -f docker-compose.prod.yml up -d --build

# Apply migrations (use 'run --rm' — containers may be crash-looping)
docker compose -f docker-compose.prod.yml run --rm api-prod npx prisma migrate deploy
docker compose -f docker-compose.prod.yml run --rm api-dev npx prisma migrate deploy

# Restart so they pick up the migrated database
docker compose -f docker-compose.prod.yml restart api-prod api-dev
```

If there are **no schema changes**, a simple rebuild is enough:

```bash
cd ~/guitar-and-frostedglass-dev
git pull
cd backend
docker compose -f docker-compose.prod.yml up -d --build
```

On startup, each API container automatically seeds an admin account (from `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env`) if no admin user exists in its database.

> **Why `run --rm` instead of `exec`?**
> `exec` connects to a running container. If the app crashes on startup (e.g. because a migration hasn't been applied yet), the container is stuck in a restart loop and `exec` will fail with "Container is restarting". `run --rm` starts a fresh one-off container to run the command and removes it when done.

### SSL certificate renewal

Certbot installs a systemd timer that auto-renews. To verify:

```bash
sudo certbot renew --dry-run
```

If auto-renewal fails or you need to manually renew:

```bash
sudo certbot renew
```

If the certificate is completely broken, re-issue it:

```bash
sudo certbot --nginx -d gfg-api.duckdns.org
```

The cert expires every 90 days. Certbot renews it when 30 days remain.

### Backup database

```bash
cd ~/guitar-and-frostedglass-dev/backend

# Backup prod
docker compose -f docker-compose.prod.yml exec postgres pg_dump -U postgres gfg_prod > backup_prod_$(date +%Y%m%d).sql

# Backup dev
docker compose -f docker-compose.prod.yml exec postgres pg_dump -U postgres gfg_dev > backup_dev_$(date +%Y%m%d).sql
```

### Restore database

```bash
docker compose -f docker-compose.prod.yml exec -T postgres psql -U postgres gfg_prod < backup_prod_YYYYMMDD.sql
```

### Reset prod database (fresh start for production launch)

```bash
cd ~/guitar-and-frostedglass-dev/backend
docker compose -f docker-compose.prod.yml exec postgres pg_dump -U postgres gfg_prod > backup_prod_before_reset.sql
docker compose -f docker-compose.prod.yml exec postgres psql -U postgres -c "DROP DATABASE gfg_prod;"
docker compose -f docker-compose.prod.yml exec postgres psql -U postgres -c "CREATE DATABASE gfg_prod;"
docker compose -f docker-compose.prod.yml run --rm api-prod npx prisma migrate deploy
docker compose -f docker-compose.prod.yml restart api-prod
```

### Local frontend development against dev API

```bash
cd frontend
VITE_API_URL=https://gfg-api.duckdns.org/dev-api npm run dev
```

---

## User Registration Flow

Registration is invite-only. The flow works as follows:

1. **Admin logs in** to the web app (via email or display name + password)
2. **Admin opens the admin panel** (管理后台) from the dropdown menu in the header
3. **Admin generates an invite code** — each code is valid for **15 minutes** and can only be used once
4. **Admin shares the code** with the person who needs to register (via chat, email, etc.)
5. **The person opens the registration page**, enters the invite code along with their email, display name, and password
6. **If the code is valid and not expired**, the account is created; otherwise registration is rejected

### Admin account bootstrap

On first startup, the API automatically creates an admin account using the `ADMIN_EMAIL` and `ADMIN_PASSWORD` environment variables (if no admin exists in the database). This happens independently for both `gfg_prod` and `gfg_dev` databases.

After the initial admin is created, you can:
- Log in as admin on the web app
- Generate invite codes for other users
- Promote other users to admin from the admin panel

### Login

Users can log in with **either their email or their display name** (plus password). The system auto-detects which one was provided based on whether the input contains `@`.

---

## Prisma Migration Workflow

Prisma migration is a two-step process done in two different places:

| Step | Where | Command | Purpose |
|------|-------|---------|---------|
| Generate migration SQL | **Local machine** | `prisma migrate dev --name xxx` | Diffs the schema, generates SQL files in `prisma/migrations/` |
| Apply migration SQL | **Server (Docker)** | `prisma migrate deploy` | Executes existing SQL files against the production database |

### Generating migrations locally

You need a temporary PostgreSQL to generate migration files. If you don't have Docker locally, use Homebrew:

```bash
brew install postgresql@16
brew services start postgresql@16
/opt/homebrew/opt/postgresql@16/bin/createdb my_temp_db

cd backend
DATABASE_URL="postgresql://$(whoami)@localhost:5432/my_temp_db" npx --no-install prisma migrate dev --name describe-your-change

# Clean up
brew services stop postgresql@16
```

> **Important:** Do NOT use `npx prisma` without `--no-install` — it may download the latest Prisma (v7+) which requires a different Node version. Always use `npx --no-install` to use the project's local Prisma v5.

After the migration files are generated, commit and push them:

```bash
git add prisma/migrations/
git commit -m "add migration: describe-your-change"
git push
```

### Applying migrations on the server

```bash
ssh g-f-backend-ubuntu
cd ~/guitar-and-frostedglass-dev
git pull
cd backend
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml run --rm api-prod npx prisma migrate deploy
docker compose -f docker-compose.prod.yml run --rm api-dev npx prisma migrate deploy
docker compose -f docker-compose.prod.yml restart api-prod api-dev
```

---

## DuckDNS IP update

If the server IP changes, update DuckDNS:

```bash
curl "https://www.duckdns.org/update?domains=gfg-api&token=YOUR_DUCKDNS_TOKEN&ip=NEW_IP"
```

---

## Full Setup From Scratch

Only needed if you're setting up a brand new server.

### 1. Install Docker

```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
sudo apt install docker-compose-plugin -y
# Log out and back in
```

### 2. Open firewall (Oracle Cloud Ubuntu requires this)

```bash
sudo iptables -I INPUT 5 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 5 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save
```

The rules must be **above** the REJECT-all rule. Verify with:

```bash
sudo iptables -L INPUT -n --line-numbers
```

### 3. Install Nginx + Certbot

```bash
sudo apt install nginx certbot python3-certbot-nginx -y
```

### 4. Clone repo and create .env

```bash
git clone git@github.com:guitar-and-frostedglass/guitar-and-frostedglass-dev.git ~/guitar-and-frostedglass-dev
cd ~/guitar-and-frostedglass-dev/backend

cat > .env << EOF
POSTGRES_PASSWORD=$(openssl rand -base64 24)
JWT_SECRET_PROD=$(openssl rand -base64 32)
JWT_SECRET_DEV=$(openssl rand -base64 32)
CORS_ORIGIN_PROD=https://guitar-and-frostedglass.github.io
CORS_ORIGIN_DEV=https://guitar-and-frostedglass.github.io,http://localhost:3000
ADMIN_EMAIL=your-admin@email.com
ADMIN_PASSWORD=$(openssl rand -base64 16)
EOF

# IMPORTANT: note down the generated ADMIN_PASSWORD so you can log in later
cat .env | grep ADMIN_PASSWORD
```

### 5. Start containers and migrate

```bash
docker compose -f docker-compose.prod.yml up -d --build

# Containers may crash-loop before migration — this is expected. Use 'run --rm':
docker compose -f docker-compose.prod.yml run --rm api-prod npx prisma migrate deploy
docker compose -f docker-compose.prod.yml run --rm api-dev npx prisma migrate deploy

# Restart so they boot successfully with the migrated database
docker compose -f docker-compose.prod.yml restart api-prod api-dev
```

Verify the admin seed ran successfully:

```bash
docker compose -f docker-compose.prod.yml logs --tail 10 api-prod | grep -E "Seed|运行在"
docker compose -f docker-compose.prod.yml logs --tail 10 api-dev | grep -E "Seed|运行在"
```

You should see:
```
[Seed] 已创建管理员账号: your-admin@email.com
🎸 Guitar & Frosted Glass API 运行在 http://localhost:4000
```

### 6. Configure Nginx

Write `/etc/nginx/sites-available/gfg-api` with this content:

```nginx
server {
    listen 80;
    server_name gfg-api.duckdns.org;

    location /api/ {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /dev-api/ {
        rewrite ^/dev-api(.*)$ /api$1 break;
        proxy_pass http://localhost:4001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Then enable and get SSL:

```bash
sudo ln -sf /etc/nginx/sites-available/gfg-api /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d gfg-api.duckdns.org
```

### 7. GitHub Pages setup

1. Repo Settings > Secrets and variables > Actions > Variables: add `API_URL` = `https://gfg-api.duckdns.org/api`
2. Repo Settings > Pages: set source to GitHub Actions
3. Push to `main` triggers frontend deploy via `.github/workflows/deploy-frontend.yml`

### 8. First login and invite users

1. Open `https://guitar-and-frostedglass.github.io/login`
2. Log in with the `ADMIN_EMAIL` and `ADMIN_PASSWORD` from step 4
3. Click the user avatar dropdown > **管理后台**
4. Go to the **邀请码** tab and click **生成邀请码**
5. Copy the code and send it to the person you want to invite
6. They have **15 minutes** to register at the `/register` page using the code
