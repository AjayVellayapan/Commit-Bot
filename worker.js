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
const branch = config.branch;
const git = simpleGit();

async function autoCommit() {
  try {
    const status = await git.status();

    if (status.files.length === 0) return; // nothing to commit

    await git.add('.');
    await git.commit(`Commit-bot: ${new Date().toLocaleString()}`);
    await git.push('origin', branch);

    fs.writeFileSync(LAST_RUN_LOG, new Date().toLocaleString());
    console.log(`Committed and pushed to ${branch} at ${new Date().toLocaleString()}`);
  } catch (err) {
    console.error('Error during commit-bot:', err.message);
  }
}

// Run now and then schedule
autoCommit();
cron.schedule(`*/${interval} * * * *`, autoCommit);
