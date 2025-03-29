#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const simpleGit = require('simple-git');
const cron = require('node-cron');

const CONFIG_FILE = path.join(process.cwd(), '.commit-bot/config.json');
const LAST_RUN_LOG = path.join(process.cwd(), '.commit-bot/last-run.log');

if (!fs.existsSync(CONFIG_FILE)) {
  console.error('Commit-bot config not found. Exiting.');
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
const interval = parseInt(config.interval);
const git = simpleGit();

async function autoCommit() {
  try {
    const status = await git.status();
    if (status.files.length === 0) {
      console.log(`[${new Date().toLocaleTimeString()}] No changes to commit.`);
      return;
    }

    await git.add('.');
    await git.commit(`Commit-bot: ${new Date().toLocaleString()}`);
    await git.push();

    fs.writeFileSync(LAST_RUN_LOG, new Date().toLocaleString());
    console.log(`✅ Auto-committed and pushed at ${new Date().toLocaleString()}`);
  } catch (err) {
    console.error('❌ Error during commit-bot:', err.message);
  }
}

// Run now and then schedule
autoCommit();
cron.schedule(`*/${interval} * * * *`, autoCommit);
