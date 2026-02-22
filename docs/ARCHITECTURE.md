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
| `CORS_ORIGIN_PROD` | api-prod | Allowed CORS origin (GitHub Pages URL) |
| `CORS_ORIGIN_DEV` | api-dev | Allowed CORS origins (GitHub Pages + localhost, comma-separated) |

### Database initialization

On first start, `init-db.sh` is mounted into the PostgreSQL container at `/docker-entrypoint-initdb.d/`. It creates both `gfg_dev` and `gfg_prod` databases. This only runs when the `postgres_data` volume is empty (first boot).

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
- Security: helmet, cors

### API routes

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/health` | No | Health check (note: NOT under /api/) |
| POST | `/api/auth/register` | No | Create account |
| POST | `/api/auth/login` | No | Login, returns JWT |
| GET | `/api/auth/me` | Yes | Get current user profile |
| GET | `/api/notes` | Yes | List user's notes |
| POST | `/api/notes` | Yes | Create note |
| PUT | `/api/notes/:id` | Yes | Update note |
| DELETE | `/api/notes/:id` | Yes | Delete note |

### Database schema

**users** table:
- `id` (UUID, PK)
- `email` (unique)
- `password_hash`
- `display_name`
- `created_at`, `updated_at`

**notes** table:
- `id` (UUID, PK)
- `content` (text)
- `color` (string, default "yellow")
- `position_x`, `position_y` (int)
- `user_id` (FK → users.id, cascade delete)
- `created_at`, `updated_at`

Managed via Prisma migrations in `backend/prisma/migrations/`.

## Frontend

### Tech stack

- React 18 + TypeScript + Vite
- TailwindCSS
- Zustand (state management)
- React Router DOM 6
- Axios (HTTP client)

### Build configuration

- Base path: `/guitar-and-frostedglass-dev/` (for GitHub Pages)
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

They share the same schema (both receive Prisma migrations), but different JWT secrets prevent tokens from working across environments.

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

## File locations on server

| Path | What |
|------|------|
| `~/guitar-and-frostedglass-dev/` | Git repo |
| `~/guitar-and-frostedglass-dev/backend/.env` | Docker Compose env vars (secrets) |
| `~/guitar-and-frostedglass-dev/backend/docker-compose.prod.yml` | Production compose file |
| `/etc/nginx/sites-available/gfg-api` | Nginx config |
| `/etc/letsencrypt/live/gfg-api.duckdns.org/` | SSL certificate files |
| Docker volume `backend_postgres_data` | PostgreSQL data |
