# Commit Bot

**Commit Bot** is a CLI tool that automatically commits and pushes changes on the current working branch at a set time interval.

## Features

- Auto-commits and pushes any local changes
- Runs silently in the background with PM2
- Works on the current branch

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
You'll be prompted to set the commit interval in minutes (e.g. `30`).

### Step 2: Start the bot
```bash
commit-bot start
```
This starts a background process that checks for changes and auto-commits + pushes them every X minutes.

### Step 3: Check status
```bash
commit-bot status
```
Shows if the bot is running and when the last auto-commit occurred.

### Step 4: Stop the bot
```bash
commit-bot stop
```
Stops the background sync process.

---

## Configuration

Stored in `.commit-bot/config.json` (not tracked by Git):
```json
{
  "interval": "30"
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
