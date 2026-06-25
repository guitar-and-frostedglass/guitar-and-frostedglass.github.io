---
name: gf-deploy
description: >
  Deploy the Guitar & Frosted Glass backend to the Oracle Cloud server.
  TRIGGER when the user says "/gf-deploy", "deploy backend", "deploy to prod",
  "push the backend changes", "上线", "部署后端", or anything that means
  "get my local backend changes running on the server." Handles the full
  pipeline: confirm local state is committed → push → SSH → run
  start_backend.sh → verify containers are healthy.
---

# gf-deploy — Backend Deploy

End-to-end deploy of local changes to `gfg-api.duckdns.org`. Follows the rules
in the `guitar-dev` skill — most importantly: `guitar` not `git`,
`npx --no-install prisma`, and `run --rm` if any container is crash-looping.

## What this skill assumes

- You're in the repo root: `/Users/yuqix/Desktop/personal/guitar/guitar-and-frostedglass-dev`.
- The `guitar` shell function exists (see `docs/ONBOARDING.md` §4).
- `~/.ssh/config` defines `g-f-backend-ubuntu` (direct SSH to the public IP `129.153.195.31`; no bastion).
- The user wants to deploy the **current `main` branch** at its current HEAD.
  Other branches → stop and ask.

## Workflow

### Step 1 — Verify local state

Run these in parallel:

```bash
guitar status
guitar log -1 --oneline
guitar rev-parse --abbrev-ref HEAD
```

Decide:

- **Not on `main`** → stop. Tell the user and ask whether to switch or abort.
- **Uncommitted changes** → stop. Show `guitar status`, ask the user if they
  want to (a) commit them first, (b) stash, or (c) abort. Do not auto-commit
  without explicit user instruction.
- **Ahead of remote** (commits not yet pushed) → fine, the next step pushes.
- **Behind remote** → run `guitar pull --ff-only` first.

### Step 2 — Push to GitHub

```bash
guitar push
```

This triggers the frontend deploy on GitHub Actions automatically if any
`frontend/`, `shared/`, or `.github/workflows/deploy-frontend.yml` file changed
on this push. The backend is deployed manually in the next step.

### Step 3 — Detect whether a migration is involved

```bash
guitar diff --name-only HEAD~1 HEAD -- backend/prisma/migrations/ backend/prisma/schema.prisma
```

If output is empty: no migration. `start_backend.sh` still runs
`prisma migrate deploy` (no-op when schema is in sync), so this is just to
tell the user what to expect.

If non-empty: there's a migration. Inform the user that `start_backend.sh` will
apply it via `npx --no-install prisma migrate deploy` against both `gfg_prod`
and `gfg_dev`.

### Step 4 — SSH and run the deploy script

```bash
ssh g-f-backend-ubuntu '~/guitar-and-frostedglass-dev/scripts/start_backend.sh'
```

Stream the output to the user. The script does:

1. `git pull` on the server (server uses bare `git` — that's fine, it's
   pulling, not committing).
2. `docker compose -f docker-compose.prod.yml up -d --build --force-recreate`
3. `docker compose ... run --rm api-prod npx prisma migrate deploy`
4. `docker compose ... run --rm api-dev  npx prisma migrate deploy`
5. `docker compose ... ps`

#### If SSH hangs / "Connection refused" / "no route to host"

SSH is direct to the public IP (`129.153.195.31`) — there's no bastion to
refresh. **Do not** edit `~/.ssh/config` to a guessed IP. Instead:

- **Hangs / timeout / no route:** the instance may be down or its public IP
  changed, or port 22 is firewalled. Verify the IP in `docs/ARCHITECTURE.md`
  and that the OCI security list + instance `iptables` allow port 22, then
  tell the user.
- **`Permission denied (publickey)`:** the deploy key isn't in the server's
  `~ubuntu/.ssh/authorized_keys`. An existing admin must add it; you can't fix
  this client-side.

#### If `prisma migrate deploy` fails

Likely causes:

- **Migration applied partially** → check `_prisma_migrations` table:
  `docker compose -f docker-compose.prod.yml exec postgres psql -U postgres -d gfg_prod -c 'SELECT migration_name, finished_at, rolled_back_at FROM _prisma_migrations ORDER BY started_at DESC LIMIT 5;'`
- **Container crash-looping before migration applied** → the script already
  uses `run --rm` which works against crashing services. If that still fails,
  inspect logs: `docker compose -f docker-compose.prod.yml logs --tail 50 api-prod`.

### Step 5 — Verify health

After the script returns, run on the server (still via SSH):

```bash
ssh g-f-backend-ubuntu 'docker compose -f ~/guitar-and-frostedglass-dev/backend/docker-compose.prod.yml ps && echo --- && curl -sf https://gfg-api.duckdns.org/api/health || echo "PROD HEALTH FAILED"; echo; curl -sf https://gfg-api.duckdns.org/dev-api/health || echo "DEV HEALTH FAILED"'
```

Note: `/health` is mounted at the API root (not under `/api/`). So the
correct probes from the server side are the container ports, but from the
outside they're served via nginx which proxies `/api/*` and `/dev-api/*` only.
The server already exposes `/health` directly per `docs/ARCHITECTURE.md` — if
the curl probes above return 404, fall back to checking container status
output (`Up` / healthy) instead.

If both containers show `Up` and `prisma migrate deploy` printed
`No pending migrations to apply` or `applied`, the deploy is done. Otherwise
surface the failing output to the user without trying to "fix" it
automatically — deploy failures usually need human judgment.

### Step 6 — Report to the user

One short summary: what was deployed (commit SHA + 1-line subject), whether
a migration ran, prod/dev container status. End-of-turn summary as usual —
no narration of intermediate steps in the final reply.

## Things to never do silently

- Don't `guitar push --force` unless the user explicitly asks.
- Don't `guitar commit` files on the user's behalf during deploy.
- Don't `docker compose down -v` or destroy the postgres volume — that wipes
  `gfg_prod` and `gfg_dev` permanently.
- Don't run `prisma migrate dev` on the server — it would attempt to author a
  new migration against prod. Server uses `migrate deploy` only.
- Don't update DuckDNS, certs, or nginx as part of deploy. Those are separate
  ops covered by `docs/DEPLOYMENT.md`.

## Related

- Rules: `.claude/skills/guitar-dev/SKILL.md`
- Full ops reference: `docs/DEPLOYMENT.md`
- The actual script this skill drives: `scripts/start_backend.sh`
