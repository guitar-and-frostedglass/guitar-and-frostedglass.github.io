# Architecture Reference

Detailed reference for the Guitar & Frosted Glass deployment. Use this file as context when asking questions about the system.

## System Overview

```
                         ┌─────────────────────────────────────────────┐
                         │              User's Browser                 │
                         └──────────┬──────────────────┬───────────────┘
                                    │                  │
                    ┌───────────────▼──┐     ┌─────────▼─────────────┐
                    │  GitHub Pages    │     │  gfg-api.duckdns.org  │
                    │  Static React   │────>│  129.153.195.31       │
                    │  (frontend)     │     │  (Oracle Cloud ARM)   │
                    └─────────────────┘     └─────────┬─────────────┘
                                                      │
                                            ┌─────────▼─────────────┐
                                            │  Nginx (port 80/443)  │
                                            │  SSL termination      │
                                            │  Path-based routing   │
                                            └────┬────────────┬─────┘
                                                 │            │
                                      /api/*     │            │  /dev-api/*
                                                 │            │  (rewrite → /api/*)
                                    ┌────────────▼──┐  ┌──────▼────────────┐
                                    │ gfg-api-prod  │  │  gfg-api-dev      │
                                    │ Node.js :4000 │  │  Node.js :4001    │
                                    │ (Express)     │  │  (Express)        │
                                    └────────┬──────┘  └──────┬────────────┘
                                             │                │
                                    ┌────────▼──┐      ┌──────▼──┐
                                    │ gfg_prod  │      │ gfg_dev │
                                    │ database  │      │ database│
                                    └────────┬──┘      └──────┬──┘
                                             │                │
                                    ┌────────▼────────────────▼──┐
                                    │  gfg-postgres              │
                                    │  PostgreSQL 16 (Alpine)    │
                                    │  Internal Docker network   │
                                    │  NOT exposed to host       │
                                    └────────────────────────────┘
```

## Server Details

| Property | Value |
|----------|-------|
| Provider | Oracle Cloud Infrastructure (OCI) Free Tier |
| Instance OCID | `ocid1.instance.oc1.phx.anyhqljt3xzuyiicpo3hjcheuuyi3df4dfdgo4lglhnrvcdlqkk26dx6zt3q` |
| Shape | VM.Standard.A1.Flex (ARM / Ampere Altra) |
| CPUs | 2 OCPUs |
| RAM | 12 GB |
| Disk | 50 GB |
| OS | Ubuntu 22.04 aarch64 |
| Region | us-phoenix-1 (PHX) |
| Public IP | 129.153.195.31 |
| Private IP | 10.0.0.150 |
| SSH access | Via OCI Bastion service (ProxyJump) |
| DNS | gfg-api.duckdns.org (DuckDNS) |

## Docker Containers

All managed via `docker-compose.prod.yml` in `~/guitar-and-frostedglass-dev/backend/`.

| Container | Image | Ports | Purpose |
|-----------|-------|-------|---------|
| gfg-postgres | postgres:16-alpine | 5432 (internal only) | Shared PostgreSQL with two databases |
| gfg-api-prod | backend-api-prod (built from Dockerfile) | 4000:4000 | Production API, connects to `gfg_prod` DB |
| gfg-api-dev | backend-api-dev (built from Dockerfile) | 4001:4000 | Development API, connects to `gfg_dev` DB |

### Environment variables (from `backend/.env` on server)

| Variable | Used by | Purpose |
|----------|---------|---------|
| `POSTGRES_PASSWORD` | postgres, api-prod, api-dev | PostgreSQL password (shared) |
| `JWT_SECRET_PROD` | api-prod | JWT signing key for production |
| `JWT_SECRET_DEV` | api-dev | JWT signing key for dev (separate so tokens can't cross environments) |
| `CORS_ORIGIN_PROD` | api-prod | Allowed CORS origin (`https://guitar-and-frostedglass.github.io`) |
| `CORS_ORIGIN_DEV` | api-dev | Allowed CORS origins (GitHub Pages + localhost, comma-separated) |
| `ADMIN_EMAIL` | api-prod, api-dev | Email for the initial admin account (seeded on first startup) |
| `ADMIN_PASSWORD` | api-prod, api-dev | Password for the initial admin account (bcrypt-hashed before storing) |
| `SMTP_HOST` | api-prod, api-dev | SMTP server hostname (e.g. `smtp.gmail.com`). Optional — email features disabled if unset |
| `SMTP_PORT` | api-prod, api-dev | SMTP port (default `587`) |
| `SMTP_USER` | api-prod, api-dev | SMTP login username (e.g. Gmail address) |
| `SMTP_PASS` | api-prod, api-dev | SMTP login password (e.g. Gmail App Password) |
| `SMTP_FROM` | api-prod, api-dev | Sender display in emails (e.g. `"Guitar & Frosted Glass <email>"`) |
| `FRONTEND_URL` | api-prod, api-dev | Frontend base URL for links in emails (default `https://guitar-and-frostedglass.github.io`) |

### Database initialization

On first start, `init-db.sh` is mounted into the PostgreSQL container at `/docker-entrypoint-initdb.d/`. It creates both `gfg_dev` and `gfg_prod` databases. This only runs when the `postgres_data` volume is empty (first boot).

### Admin seed

On each API container startup, `seedAdmin()` runs automatically:
- If no user with role `ADMIN` exists in the database, it creates one using `ADMIN_EMAIL` / `ADMIN_PASSWORD`
- If a user with that email already exists but isn't an admin, it promotes them
- If an admin already exists, it does nothing
- The password is bcrypt-hashed (cost factor 12) before storing — it is never saved in plain text

Both `api-prod` and `api-dev` seed independently into their own databases.

### Invite email (optional)

When an admin generates an invite code, they can optionally provide a recipient email address. If SMTP is configured (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`), the backend sends an HTML email containing:
- The 8-character invite code
- A direct registration link (`FRONTEND_URL/register?code=XXXXXXXX`)
- Expiration notice (15 minutes)

If SMTP is not configured, the feature is silently disabled — invite codes are still generated and must be shared manually. Email sending failures do not block invite code creation; the API response includes an `emailSent` boolean so the frontend can show appropriate feedback.

Uses nodemailer with SMTP transport. For Gmail, requires a Google App Password (2-Step Verification must be enabled on the Google account).

### Volume

`postgres_data` -- named Docker volume storing all PostgreSQL data. Survives container restarts and rebuilds. Only destroyed by `docker volume rm`.

## Nginx Configuration

File: `/etc/nginx/sites-available/gfg-api` (symlinked to `sites-enabled`)

### Routing

| Incoming path | Proxied to | Rewrite |
|---------------|-----------|---------|
| `/api/*` | `http://localhost:4000/api/*` | None (pass-through) |
| `/dev-api/*` | `http://localhost:4001/api/*` | `/dev-api/x` → `/api/x` |

### SSL

- Certificate: Let's Encrypt via certbot
- Files: `/etc/letsencrypt/live/gfg-api.duckdns.org/`
- Auto-renewal: systemd timer (`certbot.timer`), renews when 30 days remain
- Expiry cycle: 90 days

Certbot auto-modified the nginx config to add the `listen 443 ssl` block and redirect HTTP to HTTPS.

## Backend Application

### Tech stack

- Runtime: Node.js 20 (Alpine, ARM64)
- Framework: Express 4.18
- ORM: Prisma 5.x with PostgreSQL
- Auth: JWT (jsonwebtoken) + bcryptjs
- Validation: express-validator
- Email: nodemailer (SMTP, optional)
- Security: helmet, cors

### API routes

| Method | Path | Auth | Admin | Purpose |
|--------|------|------|-------|---------|
| GET | `/health` | No | No | Health check (NOT under /api/) |
| POST | `/api/auth/register` | No | No | Register (requires valid invite code) |
| POST | `/api/auth/login` | No | No | Login by email or display name |
| GET | `/api/auth/me` | Yes | No | Get current user profile |
| PUT | `/api/auth/avatar` | Yes | No | Upload avatar (base64 data URI, max 500KB) |
| PUT | `/api/auth/password` | Yes | No | Change password (requires current password) |
| GET | `/api/notes` | Yes | No | List all notes (all users, with reply counts) |
| GET | `/api/notes/:id` | Yes | No | Get single note with all replies |
| POST | `/api/notes` | Yes | No | Create note (title + content + color) |
| PUT | `/api/notes/:id` | Yes | No | Update own note |
| DELETE | `/api/notes/:id` | Yes | No | Delete own note |
| POST | `/api/notes/:id/replies` | Yes | No | Reply to any note |
| DELETE | `/api/notes/:id/replies/:replyId` | Yes | No | Delete own reply (admin can delete any) |
| GET | `/api/admin/users` | Yes | Yes | List all registered users |
| DELETE | `/api/admin/users/:id` | Yes | Yes | Delete a user |
| PUT | `/api/admin/users/:id/role` | Yes | Yes | Change user role (USER/ADMIN) |
| POST | `/api/admin/invite-codes` | Yes | Yes | Generate an invite code (15 min expiry); optionally sends invite email if `email` is provided in body |
| GET | `/api/admin/invite-codes` | Yes | Yes | List all invite codes |
| GET | `/api/admin/deleted-replies` | Yes | Yes | List all deleted reply records |

### Database schema

**users** table:
- `id` (UUID, PK)
- `email` (unique)
- `password_hash`
- `display_name`
- `avatar` (text, nullable — base64 data URI for user avatar)
- `role` (enum: `USER`, `ADMIN`, default `USER`)
- `created_at`, `updated_at`

**notes** table:
- `id` (UUID, PK)
- `title` (text, default "")
- `content` (text, default "")
- `color` (string, default "yellow")
- `position_x`, `position_y` (int, legacy — unused in current UI)
- `user_id` (FK → users.id, cascade delete)
- `created_at`, `updated_at`

**replies** table:
- `id` (UUID, PK)
- `content` (text)
- `note_id` (FK → notes.id, cascade delete)
- `user_id` (FK → users.id, cascade delete)
- `created_at`, `updated_at`

**invite_codes** table:
- `id` (UUID, PK)
- `code` (unique, 8-char hex string)
- `expires_at` (timestamp, 15 minutes after creation)
- `used` (boolean, default false)
- `used_by` (nullable, UUID of the user who used it)
- `creator_id` (FK → users.id, cascade delete)
- `created_at`

**deleted_replies** table (audit log for deleted replies):
- `id` (UUID, PK)
- `original_reply_id` (UUID of the deleted reply)
- `content` (text — preserved reply content)
- `note_id` (UUID of the parent note)
- `note_title` (text — denormalized note title at time of deletion)
- `reply_user_id` (UUID of the reply author)
- `reply_user_name` (text — denormalized display name of reply author)
- `deleted_by_id` (UUID of the user who performed the deletion)
- `deleted_by_name` (text — denormalized display name of deleter)
- `reply_created_at` (timestamp — when the original reply was created)
- `deleted_at` (timestamp — when the reply was deleted)

Managed via Prisma migrations in `backend/prisma/migrations/`. Migration files are generated locally with `prisma migrate dev` and applied on the server with `prisma migrate deploy`. See [DEPLOYMENT.md](DEPLOYMENT.md#prisma-migration-workflow) for the full workflow.

## Frontend

### Tech stack

- React 18 + TypeScript + Vite
- TailwindCSS
- Zustand (state management)
- React Router DOM 6
- Axios (HTTP client)
- react-easy-crop (avatar image cropping)

### Pages

| Route | Access | Description |
|-------|--------|-------------|
| `/login` | Public | Login by email or display name |
| `/register` | Public | Register with invite code (auto-fills from `?code=` query param) |
| `/` | Authenticated | Dashboard — shared note board with chat threads |
| `/admin` | Admin only | User management + invite code generation |

### Build configuration

- Base path: `/` (repo is `guitar-and-frostedglass.github.io`, served from root)
- API URL: set via `VITE_API_URL` env var at build time
- Deployed via GitHub Actions (`.github/workflows/deploy-frontend.yml`)
- Trigger: push to `main` that touches `frontend/`, `shared/`, or the workflow file

### GitHub settings required

- Repository variable `API_URL`: `https://gfg-api.duckdns.org/api`
- Pages source: GitHub Actions

## Dev/Prod Data Isolation

The two databases are completely independent:

- **gfg_dev**: used by the dev API (`/dev-api`). All testing happens here.
- **gfg_prod**: used by the prod API (`/api`). Only real user data.

They share the same schema (both receive Prisma migrations), but different JWT secrets prevent tokens from working across environments. Each database has its own admin user seeded independently.

### Workflow

1. During development: frontend (local or GitHub Pages with dev API URL) talks to `/dev-api` → `gfg_dev`
2. When going live: GitHub Pages `API_URL` variable points to `/api` → `gfg_prod`
3. Ongoing testing uses `/dev-api` and never touches production data

## SSH Access

The instance is on a private subnet (10.0.0.150) behind an OCI Bastion. SSH config (`~/.ssh/config`):

```
Host oci-bastion
    HostName host.bastion.us-phoenix-1.oci.oraclecloud.com
    User <bastion-session-ocid>
    IdentityFile ~/.ssh/id_ed25519_guitar
    Port 22

Host g-f-backend-ubuntu
    HostName 10.0.0.150
    User ubuntu
    IdentityFile ~/.ssh/id_ed25519_guitar
    ProxyJump oci-bastion
```

A new bastion session must be created before SSH (the session OCID in the config needs updating each time). Use the bastion-connect script or create sessions via the OCI console/CLI.

## OCI Networking

- VCN subnet: 10.0.0.0/24
- Security list ingress: ports 22, 80, 443 (TCP), ICMP
- Security list egress: all traffic allowed
- **iptables** on the instance must also allow ports 80/443 (Oracle Ubuntu blocks them by default even when the security list allows them)

## Helper Scripts

All scripts live in `scripts/` at the repo root. They are meant to be run from the local development machine unless noted otherwise.

| Script | Run where | Purpose |
|--------|-----------|---------|
| `scripts/frontend_dev.sh` | Local | Starts the Vite dev server (`npm run dev`) pointing at the remote dev API. Auto-installs `node_modules` if missing. |
| `scripts/start_backend.sh` | Server (via SSH) | Pulls latest code, rebuilds Docker containers, applies Prisma migrations to both prod and dev databases, and shows container status. One-command deploy. |
| `scripts/prisma_migrate.sh` | Local | Generates a new Prisma migration locally. Starts a temporary local PostgreSQL (Homebrew), runs `prisma migrate dev --name <name>`, then stops PostgreSQL. Pass the migration name as an argument or it will prompt. |
| `scripts/backup_database.sh` | Local | SSHes into the server, dumps both `gfg_prod` and `gfg_dev` databases, downloads the SQL files to `backups/`, and prunes old backups (keeps last 10 per database). |

### Usage examples

```bash
# Local frontend development
./scripts/frontend_dev.sh

# Generate a new migration (local)
./scripts/prisma_migrate.sh add_some_feature

# Deploy backend update (run on server, or SSH first)
ssh g-f-backend-ubuntu
~/guitar-and-frostedglass-dev/scripts/start_backend.sh

# Backup databases to local machine
./scripts/backup_database.sh
```

## File locations on server

| Path | What |
|------|------|
| `~/guitar-and-frostedglass-dev/` | Git repo |
| `~/guitar-and-frostedglass-dev/backend/.env` | Docker Compose env vars (secrets) |
| `~/guitar-and-frostedglass-dev/backend/docker-compose.prod.yml` | Production compose file |
| `/etc/nginx/sites-available/gfg-api` | Nginx config |
| `/etc/letsencrypt/live/gfg-api.duckdns.org/` | SSL certificate files |
| Docker volume `backend_postgres_data` | PostgreSQL data |
