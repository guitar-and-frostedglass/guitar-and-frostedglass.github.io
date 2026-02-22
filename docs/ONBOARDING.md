# Onboarding — New Machine Setup

Everything you need to go from a fresh machine to a working Guitar & Frosted Glass development environment. Instructions are provided for **macOS**, **Linux** (Ubuntu/Debian), and **Windows**.

> **Windows users:** Install [WSL 2](https://learn.microsoft.com/en-us/windows/wsl/install) first, then follow the **Linux** instructions inside WSL. All helper scripts are bash-based and run natively in WSL. The only Windows-native step is installing WSL itself.

---

## 1. Install a Package Manager

**macOS**

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Follow the post-install instructions to add Homebrew to your PATH.

**Linux (Ubuntu/Debian)**

`apt` is already available. Make sure it's up to date:

```bash
sudo apt update && sudo apt upgrade -y
```

**Windows**

```powershell
wsl --install
```

Reboot, then open the Ubuntu terminal. Everything below happens inside WSL (follow the Linux instructions).

---

## 2. Install System Dependencies

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 20.x (matches `.node-version` and Docker image) | Frontend + backend runtime |
| PostgreSQL | 16 | Local Prisma migration generation |
| Git | latest | Source control |

**macOS**

```bash
brew install node@20 postgresql@16 git
echo 'export PATH="/opt/homebrew/opt/node@20/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

**Linux**

```bash
# Node.js 20 via NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git

# PostgreSQL 16
sudo apt install -y postgresql-16 postgresql-client-16
```

> **Tip:** If you use `nvm` or `fnm`, install Node 20 through that instead and skip the package-manager node install. This works on all platforms.

Verify:

```bash
node -v   # v20.x
npm -v
git --version
```

---

## 3. SSH Key Setup

The project uses a dedicated SSH key for both GitHub pushes and server access.

### 3a. Generate the key

```bash
ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519_guitar -C "guitar-and-frostedglass"
```

Press Enter for no passphrase (or set one — your choice).

> **Windows (WSL):** Run this inside the WSL terminal. The key is stored at `~/.ssh/` inside the WSL filesystem.

### 3b. Add the public key to GitHub

```bash
cat ~/.ssh/id_ed25519_guitar.pub
```

Copy the output and add it as a deploy key (with write access) to the repository:
**GitHub → guitar-and-frostedglass/guitar-and-frostedglass-dev → Settings → Deploy keys → Add deploy key**

### 3c. Configure SSH for the backend server

Add to `~/.ssh/config` (create the file if it doesn't exist):

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

The bastion session OCID changes each time — update `User` under `oci-bastion` before SSHing. Create sessions via the OCI console or CLI.

---

## 4. Set Up the `guitar` Command

The `guitar` command wraps `git` with the correct SSH key and commit identity so your pushes use the project deploy key without touching your global git config.

**macOS (zsh) — add to `~/.zshrc`:**

```bash
guitar() {
    local guitar_ssh_key="${GUITAR_SSH_KEY:-$HOME/.ssh/id_ed25519_guitar}"
    GIT_SSH_COMMAND="ssh -i \"$guitar_ssh_key\" -o IdentitiesOnly=yes" \
    git \
        -c user.email="guitar.and.frostedglass@gmail.com" \
        -c user.name="guitar-and-frostedglass" \
        "$@"
}
```

```bash
source ~/.zshrc
```

**Linux / WSL (bash) — add to `~/.bashrc`:**

```bash
guitar() {
    local guitar_ssh_key="${GUITAR_SSH_KEY:-$HOME/.ssh/id_ed25519_guitar}"
    GIT_SSH_COMMAND="ssh -i \"$guitar_ssh_key\" -o IdentitiesOnly=yes" \
    git \
        -c user.email="guitar.and.frostedglass@gmail.com" \
        -c user.name="guitar-and-frostedglass" \
        "$@"
}
```

```bash
source ~/.bashrc
```

> The function body is identical — only the shell config file differs.

**Windows (PowerShell) — add to `$PROFILE`:**

If you need `guitar` in PowerShell outside WSL (rare — prefer WSL for all development):

```powershell
function guitar {
    $env:GIT_SSH_COMMAND = "ssh -i `"$HOME\.ssh\id_ed25519_guitar`" -o IdentitiesOnly=yes"
    git -c user.email="guitar.and.frostedglass@gmail.com" -c user.name="guitar-and-frostedglass" @args
    $env:GIT_SSH_COMMAND = $null
}
```

Open the profile with `notepad $PROFILE` and paste it in, then restart PowerShell. **But again, using WSL is strongly recommended over native PowerShell.**

From now on, **always use `guitar` instead of `git`** in this repository:

```bash
guitar clone git@github.com:guitar-and-frostedglass/guitar-and-frostedglass-dev.git
guitar status
guitar add -A && guitar commit -m "feat: something" && guitar push
```

---

## 5. Clone the Repository

```bash
guitar clone git@github.com:guitar-and-frostedglass/guitar-and-frostedglass-dev.git
cd guitar-and-frostedglass-dev
```

---

## 6. Install Project Dependencies

```bash
cd frontend && npm install && cd ..
cd backend && npm install && cd ..
```

---

## 7. Set Up the Local Database (for Prisma Migrations)

The local PostgreSQL is only needed for **generating** new migration files. You do NOT need it running for everyday frontend development.

### 7a. Create the local database

**macOS**

```bash
brew services start postgresql@16
/opt/homebrew/opt/postgresql@16/bin/createdb guitar_frostedglass
brew services stop postgresql@16
```

**Linux / WSL**

```bash
sudo systemctl start postgresql

# Set a password for the postgres user (needed for DATABASE_URL)
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres';"
sudo -u postgres createdb guitar_frostedglass

sudo systemctl stop postgresql
```

> On Linux the default superuser is `postgres`. The migration script uses `postgresql://postgres:postgres@localhost:5432/guitar_frostedglass` as the DATABASE_URL. Make sure the password matches.

### 7b. Verify it works

The migration script auto-detects your OS and uses the right commands:

```bash
./scripts/prisma_migrate.sh test_setup
```

You should see `All migrations have been applied`. Then discard the test migration:

```bash
guitar checkout -- backend/prisma/
```

> **Important:** Always use `npx --no-install` for Prisma commands to use the project's pinned v5, not a globally installed version. The helper script does this for you.

---

## 8. (Optional) Local Backend Development

If you want to run the full backend locally (instead of using the remote dev API):

### Option A: Docker Compose (recommended, all platforms)

Install Docker first if you don't have it:

| Platform | Install |
|----------|---------|
| macOS | [Docker Desktop for Mac](https://docs.docker.com/desktop/install/mac-install/) |
| Linux | `curl -fsSL https://get.docker.com \| sudo sh && sudo usermod -aG docker $USER` (log out and back in) |
| Windows | [Docker Desktop for Windows](https://docs.docker.com/desktop/install/windows-install/) (enable WSL 2 backend) |

Then:

```bash
cd backend
cp .env.example .env
docker compose up -d
```

This starts PostgreSQL + the API at `http://localhost:4000`. The backend auto-seeds an admin account from `.env`.

### Option B: Native Node.js

```bash
cd backend
cp .env.example .env
# Edit .env — set DATABASE_URL to your local postgres:
#   macOS:  postgresql://<your-username>@localhost:5432/guitar_frostedglass
#   Linux:  postgresql://postgres:postgres@localhost:5432/guitar_frostedglass
```

Start PostgreSQL, then:

```bash
# macOS
brew services start postgresql@16

# Linux / WSL
sudo systemctl start postgresql
```

```bash
npm run dev
```

The dev server starts at `http://localhost:4000` with hot-reload via `tsx watch`.

---

## 9. Frontend Development

The fastest way to start working on the frontend:

```bash
./scripts/frontend_dev.sh
```

This automatically:
- Installs `node_modules` if missing
- Starts Vite on `http://localhost:3000`
- Points at the remote dev API (`https://gfg-api.duckdns.org/dev-api`)

Or do it manually:

```bash
cd frontend
VITE_API_URL=https://gfg-api.duckdns.org/dev-api npm run dev
```

To use a local backend instead:

```bash
cd frontend
npm run dev
# Vite proxies /api/* to localhost:4000 automatically (see vite.config.ts)
```

> **Windows (non-WSL) note:** The `VITE_API_URL=... npm run dev` inline env syntax only works in bash. In PowerShell, set it first: `$env:VITE_API_URL="https://gfg-api.duckdns.org/dev-api"; npm run dev`. Or just use WSL.

---

## 10. Helper Scripts Reference

All scripts live in `scripts/` and are bash scripts. On macOS and Linux they run directly. On Windows, run them inside WSL or Git Bash.

| Command | Where | What it does |
|---------|-------|--------------|
| `./scripts/frontend_dev.sh` | Local | Starts the Vite dev server pointing at the remote dev API |
| `./scripts/prisma_migrate.sh <name>` | Local | Generates a Prisma migration (auto-detects OS; starts/stops local PostgreSQL) |
| `./scripts/start_backend.sh` | Server | Pulls code, rebuilds containers, applies migrations — one-command deploy |
| `./scripts/backup_database.sh` | Local | SSHes into server, dumps both databases, downloads to `backups/` |

### Generate a new database migration

```bash
./scripts/prisma_migrate.sh add_some_column
```

The script detects macOS vs Linux and uses the appropriate PostgreSQL start/stop commands. Commit the generated files in `backend/prisma/migrations/` and push.

### Deploy backend changes

```bash
ssh g-f-backend-ubuntu
~/guitar-and-frostedglass-dev/scripts/start_backend.sh
```

### Backup databases

```bash
./scripts/backup_database.sh
```

Downloads SQL dumps to `backups/` and keeps only the 10 most recent per database.

---

## 11. Typical Development Workflow

```
1.  guitar pull                              # get latest
2.  ./scripts/frontend_dev.sh                # start frontend
3.  # ... make changes, test in browser ...
4.  guitar add -A
5.  guitar commit -m "feat: description"
6.  guitar push                              # pushes to GitHub
7.  # frontend auto-deploys via GitHub Actions if you touched frontend/ or shared/
8.  # for backend changes: ssh into server and run start_backend.sh
```

### If your change includes a schema change:

```
1.  Edit backend/prisma/schema.prisma
2.  ./scripts/prisma_migrate.sh describe_change
3.  guitar add -A && guitar commit -m "add migration: describe_change"
4.  guitar push
5.  ssh g-f-backend-ubuntu
6.  ~/guitar-and-frostedglass-dev/scripts/start_backend.sh
```

---

## 12. Verification Checklist

After setup, confirm everything works:

- [ ] `node -v` prints `v20.x`
- [ ] `guitar status` works inside the repo (no SSH errors)
- [ ] `./scripts/frontend_dev.sh` starts Vite on `http://localhost:3000`
- [ ] You can log in at `http://localhost:3000` using an account on the dev API
- [ ] `ssh g-f-backend-ubuntu` connects to the server (after setting up a bastion session)
- [ ] `./scripts/prisma_migrate.sh test_setup` generates a migration without errors (delete it afterwards: `guitar checkout -- backend/prisma/`)

---

## Troubleshooting

### `guitar push` fails with "Permission denied (publickey)"

- Verify the SSH key exists: `ls -la ~/.ssh/id_ed25519_guitar`
- Verify it's added as a deploy key on GitHub with **write access**
- Test manually: `ssh -i ~/.ssh/id_ed25519_guitar -T git@github.com`

### `npx prisma` downloads Prisma v7 / wrong version

Always use `npx --no-install prisma ...` to use the project's local Prisma v5. Never run bare `npx prisma` — it may auto-install the latest major version which is incompatible. The helper scripts already handle this.

### Local PostgreSQL won't start

**macOS**

```bash
brew services list
brew services restart postgresql@16
/opt/homebrew/opt/postgresql@16/bin/pg_isready
```

**Linux / WSL**

```bash
sudo systemctl status postgresql
sudo systemctl restart postgresql
pg_isready
```

### PostgreSQL auth error on Linux

If you get `password authentication failed for user "postgres"`, set the password:

```bash
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres';"
```

The migration script expects `postgres:postgres` as the credentials on Linux.

### SSH to server hangs

The bastion session has likely expired. Create a new one in the OCI console and update the `User` field under `Host oci-bastion` in `~/.ssh/config`.

### Frontend dev server can't reach the API

- If using remote dev API: check that `VITE_API_URL` is set to `https://gfg-api.duckdns.org/dev-api`
- If using local backend: make sure `docker compose up -d` is running (or `npm run dev` in `backend/`)
- Check the API health endpoint: `curl https://gfg-api.duckdns.org/dev-api/health`

### Scripts won't run on Windows

All scripts are bash-based. Run them inside **WSL** or **Git Bash**, not PowerShell or cmd.
