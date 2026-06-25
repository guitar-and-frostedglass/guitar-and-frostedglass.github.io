---
name: guitar-dev
description: >
  Enforce the Guitar & Frosted Glass project's development workflow and design rules.
  TRIGGER when working in this repo, especially when: editing backend/frontend/shared
  code, running git operations, generating/applying Prisma migrations, deploying
  backend, modifying schema, configuring CORS/auth, or anything that touches the
  prod/dev API split. These rules are LOAD-BEARING — violating them breaks deploys,
  pushes under the wrong git identity, or corrupts production data.
---

# guitar-dev — Project Workflow Enforcement

You are working in the **Guitar & Frosted Glass** repo. The rules below override
default behavior. Follow them exactly — they encode hard-won lessons from past
incidents (Prisma v7 breakage, bastion session expiry, prod data leaks).

## Hard rules (no exceptions)

### 1. Git: ALWAYS use `guitar`, never `git`

`guitar` is a shell function in the user's `~/.zshrc` / `~/.bashrc` that wraps
`git` with the project's deploy key and commit identity
(`guitar.and.frostedglass@gmail.com` / `guitar-and-frostedglass`). Using bare
`git` will push under the user's personal identity and fail auth with the
deploy key.

```bash
guitar status        # not: git status
guitar add -A
guitar commit -m "feat: ..."
guitar push
```

If you catch yourself about to type `git <something>`, stop and use `guitar`
instead. The only exception is local read-only commands the user explicitly
asked you to run as `git`.

If `guitar` is not yet defined on a fresh machine, point the user at
`docs/ONBOARDING.md` §4 — do not work around it by using bare `git`.

### 2. Prisma: NEVER `npx prisma` bare — ALWAYS `npx --no-install prisma`

Bare `npx prisma` will pull the latest Prisma (v7+), which is incompatible with
the project's pinned v5 and requires a different Node version. This has broken
the build before.

```bash
npx --no-install prisma migrate dev --name describe_change   # ✅
npx --no-install prisma migrate deploy                       # ✅
npx prisma migrate dev                                        # ❌ NEVER
```

The helper scripts (`scripts/prisma_migrate.sh`, `scripts/start_backend.sh`)
already do this correctly — prefer them over running prisma by hand.

### 3. Migration workflow is two-step, two-machines

| Step | Where | Command |
|---|---|---|
| Generate SQL | **Local** | `./scripts/prisma_migrate.sh <name>` |
| Apply SQL | **Server** | `./scripts/start_backend.sh` (or `prisma migrate deploy` on both DBs) |

Never try to generate migrations on the server, and never try to apply them
locally against prod. The flow is:

1. Edit `backend/prisma/schema.prisma` locally
2. `./scripts/prisma_migrate.sh add_xxx` → generates SQL files
3. `guitar add -A && guitar commit && guitar push`
4. SSH to server → `~/guitar-and-frostedglass-dev/scripts/start_backend.sh`

### 4. Crashing containers need `run --rm`, not `exec`

When a migration hasn't been applied yet, API containers crash-loop. `docker
compose exec` fails with "Container is restarting" — use `run --rm` to spawn a
fresh one-off container:

```bash
docker compose -f docker-compose.prod.yml run --rm api-prod npx --no-install prisma migrate deploy
docker compose -f docker-compose.prod.yml run --rm api-dev  npx --no-install prisma migrate deploy
docker compose -f docker-compose.prod.yml restart api-prod api-dev
```

### 5. Prod/Dev DB isolation — DO NOT cross the streams

- `gfg_prod` is real user data. `/api/*` → port 4000 → `gfg_prod`.
- `gfg_dev`  is test data.       `/dev-api/*` → port 4001 → `gfg_dev`.
- Separate JWT secrets (`JWT_SECRET_PROD` vs `JWT_SECRET_DEV`) — tokens
  intentionally do NOT work across environments.
- All testing/experimentation goes against `/dev-api`. Never point local dev or
  experiments at `/api`.
- When applying migrations, do both DBs (`api-prod` and `api-dev`) — the
  helper script handles this.

### 6. API response shape is `{success, data}` / `{success, error}`

Every backend route returns this envelope. Don't return raw payloads, don't add
new shapes. Frontend code unwraps `.data` everywhere.

```ts
res.json({ success: true,  data: result });
res.json({ success: false, error: "message" });
```

### 7. SSH is direct to the public IP (no bastion)

`ssh g-f-backend-ubuntu` connects straight to the public IP
(`129.153.195.31`, user `ubuntu`, key `~/.ssh/id_ed25519_guitar`). There is no
OCI bastion / `ProxyJump` anymore. If the connection hangs, the server/IP is
the suspect — check the IP in `docs/ARCHITECTURE.md` and that port 22 is open.
If it's refused with `Permission denied (publickey)`, the key isn't in the
server's `authorized_keys` — an existing admin must add it. **Do not invent an
IP or edit the config to a guessed value.**

### 8. Socket.IO requires WebSocket upgrade headers in nginx

If you touch nginx config, the `/socket.io/` and `/dev-socket.io/` location
blocks MUST keep `proxy_http_version 1.1` and the
`Upgrade` / `Connection "upgrade"` headers. Without them WebSockets fail and
Socket.IO falls back to slow HTTP long-polling. See
`docs/ARCHITECTURE.md` for the exact block.

## Standard tasks — use the helper scripts

| Task | Command |
|---|---|
| Start frontend dev (vs remote dev API) | `./scripts/frontend_dev.sh` |
| Generate Prisma migration (local)      | `./scripts/prisma_migrate.sh <name>` |
| Deploy backend (run on server)         | `./scripts/start_backend.sh` |
| Backup both DBs to local `backups/`    | `./scripts/backup_database.sh` |

Don't reinvent these inline. If a script needs a new behavior, edit the script.

## Architecture quick-facts

- **Frontend:** React 18 + TS + Vite + Tailwind + Zustand + Socket.IO client.
  Deployed to GitHub Pages via `.github/workflows/deploy-frontend.yml` on
  push to `main` touching `frontend/`, `shared/`, or the workflow file.
- **Backend:** Node 20 + Express + Prisma 5 + Postgres 16, runs in Docker on
  Oracle Cloud ARM (Ubuntu 22.04). Two API containers (prod/dev) sharing one
  Postgres with two databases. Nginx terminates SSL (Let's Encrypt).
- **Real-time:** Socket.IO emits `note:created|updated|deleted` and
  `reply:created|updated|deleted` after mutations. JWT auth via
  `socket.handshake.auth.token`. Frontend ignores events from the current
  user (avoids local-state double-update).
- **Auth:** Invite-only registration. Admin generates 8-char hex codes,
  15-min TTL, single-use. Login accepts email OR display name + password.

## When you need more detail — source the docs on demand

These docs live in `docs/` in this repo. They are the source of truth — read
them when needed instead of paraphrasing from memory, since they may have been
updated since this skill was written.

| Question | File |
|---|---|
| System topology? Container roles? DB schema? Nginx routing? Env vars? Socket.IO events? | `docs/ARCHITECTURE.md` |
| Exact request/response shape for an endpoint? | `docs/API.md` |
| How do I deploy / migrate / restore / set up a fresh server? | `docs/DEPLOYMENT.md` |
| How does a new dev set up their machine? | `docs/ONBOARDING.md` |

When the user asks about any of the above, `Read` the relevant file before
answering.

## Anti-patterns (things to avoid)

- Running `npx prisma` without `--no-install` → pulls v7 → breaks build.
- Using `git` instead of `guitar` → push fails or commits under wrong identity.
- Trying `docker compose exec` on a crash-looping API container → "Container is
  restarting" — use `run --rm`.
- Generating migrations against the server's live Postgres → don't. Local only.
- Pointing local frontend dev at `/api` instead of `/dev-api` → can mutate prod
  data with test accounts.
- Editing nginx without `sudo nginx -t && sudo systemctl reload nginx` → silent
  config break until next restart.
- Returning bare payloads from new routes instead of the `{success, data}`
  envelope → frontend `.data` unwrap blows up.
