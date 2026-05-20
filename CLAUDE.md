# Claude Code — Project Pointers

## Skills

| Skill | Trigger | What it does |
|---|---|---|
| `guitar-dev` | Any non-trivial dev work in this repo | Enforces project rules: `guitar` not `git`, pinned Prisma v5, prod/dev DB isolation, response envelope, etc. |
| `gf-deploy`  | "/gf-deploy", "deploy", "上线", "部署后端" | Pushes local commits, SSHes to the Oracle Cloud server, runs `start_backend.sh`, verifies containers. |

Definitions live in `.claude/skills/<name>/SKILL.md` — they sync via git so
they work on any machine that clones the repo.

## Reference docs (read on demand)

| File | When to read |
|---|---|
| `docs/ARCHITECTURE.md` | System topology, containers, DB schema, nginx, env vars, Socket.IO events, SSH/OCI networking |
| `docs/API.md`          | Exact request/response shape for an HTTP endpoint |
| `docs/DEPLOYMENT.md`   | Deploy, migrate, restore, fresh-server setup |
| `docs/ONBOARDING.md`   | New-machine setup (Node, SSH key, `guitar` shell function, local Postgres) |

Source these with `Read` when the question requires concrete facts — don't
paraphrase from memory.
