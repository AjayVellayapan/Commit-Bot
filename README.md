# Commit Bot

**Commit Bot** is a CLI tool that keeps a mirror branch (e.g. `mirror`) in sync with a source branch (e.g. `main`) by periodically committing and pushing any changes — even uncommitted ones — without affecting your working directory.

## Features

- Automatically mirrors a source branch into a target branch on a schedule
- Leaves your working branch and local changes untouched
- Runs continuously in the background using PM2
- Fully configurable via CLI

---

## Installation

```bash
npm install -g commit-bot
```

---

## Usage

### Step 1: Initialize in a Git repo
```bash
cd your-project
commit-bot init
```
You'll be prompted to provide:
- **Mirror branch** (e.g. `mirror`) — auto-created if missing
- **Source branch** (default: `main`) — the branch to mirror
- **Interval** in minutes (e.g. `60`)

### Step 2: Start the bot
```bash
commit-bot start
```
This runs a background process that syncs changes from `main` → `mirror` every X minutes.

### Step 3: Check status
```bash
commit-bot status
```
Shows if the bot is running and when the last sync occurred.

### Step 4: Stop the bot
```bash
commit-bot stop
```
Stops and removes the background sync process.

---

## Example

Say you're working on the `main` branch with frequent local changes. You want a stable branch called `mirror` that always reflects your progress — including uncommitted changes — every 30 minutes:

```bash
commit-bot init
# Choose: branch = mirror, track = main, interval = 30
commit-bot start
```
Now `mirror` will always be up-to-date with `main`, without touching your working directory.

---

## Configuration

Stored in `.commit-bot/config.json` (not tracked by Git):
```json
{
  "branch": "mirror",
  "track": "main",
  "interval": "60"
}
```

Also writes a timestamp to `.commit-bot/last-run.log`.

---

## Requirements
- Node.js v16+
- PM2 globally installed: `npm install -g pm2`

---

## License

MIT
