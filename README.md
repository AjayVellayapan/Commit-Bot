# Commit Bot

A simple CLI tool that automatically commits and pushes changes to a specific branch on a schedule.

## Features

- Auto-commits and pushes if changes are detected
- Runs in the background using PM2
- Customizable branch and interval

## Install

```bash
npm install -g commit-bot
```

## Usage

```bash
commit-bot init          # Setup for current repo
commit-bot start         # Start background auto-committing
commit-bot stop          # Stop the background process
commit-bot status        # Check last commit time and running status
```

## Configuration

Stored in `.commit-bot/config.json` and `.commit-bot/last-run.log`

## Examples

### 1. Initialize in a repo
```bash
cd my-project
commit-bot init
# Answer prompts: branch = commit_bot_branch, interval = 60 (every hour)
```

### 2. Start auto-committing
```bash
commit-bot start
# Will now auto-commit and push changes to 'commit_bot_branch' every hour
```

### 3. Check status
```bash
commit-bot status
# Shows PM2 status and last commit time
```

### 4. Stop the bot
```bash
commit-bot stop
# Stops the background job
```

## License

MIT
