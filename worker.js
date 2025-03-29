#!/usr/bin/env node

const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');
const os = require('os');
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
    if (status.files.length === 0) {
      console.log(`[${new Date().toLocaleTimeString()}] No changes to commit.`);
      return;
    }

    const currentBranch = status.current;
    const tempDir = path.join(os.tmpdir(), `commit-bot-${Date.now()}`);
    fse.ensureDirSync(tempDir);

    // Save all modified/untracked files
    const filesToPreserve = status.files.map(f => f.path);
    for (const file of filesToPreserve) {
      const fullPath = path.join(process.cwd(), file);
      const destPath = path.join(tempDir, file);
      fse.ensureDirSync(path.dirname(destPath));
      if (fs.existsSync(fullPath)) {
        fse.copySync(fullPath, destPath);
      }
    }

    // Checkout commit-bot branch
    if (currentBranch !== branch) {
      await git.checkout(branch);
    }

    // Copy changes into commit-bot branch
    for (const file of filesToPreserve) {
      const srcPath = path.join(tempDir, file);
      const destPath = path.join(process.cwd(), file);
      if (fs.existsSync(srcPath)) {
        fse.ensureDirSync(path.dirname(destPath));
        fse.copySync(srcPath, destPath);
      }
    }

    await git.add('.');
    await git.commit(`Commit-bot: ${new Date().toLocaleString()}`);
    await git.push('origin', branch);
    fs.writeFileSync(LAST_RUN_LOG, new Date().toLocaleString());
    console.log(`Committed and pushed to ${branch} at ${new Date().toLocaleString()}`);

    // Return to original branch and restore changes
    if (currentBranch !== branch) {
      await git.checkout(currentBranch);
      for (const file of filesToPreserve) {
        const srcPath = path.join(tempDir, file);
        const destPath = path.join(process.cwd(), file);
        if (fs.existsSync(srcPath)) {
          fse.ensureDirSync(path.dirname(destPath));
          fse.copySync(srcPath, destPath);
        }
      }
    }

    fse.removeSync(tempDir);
  } catch (err) {
    console.error('Error during commit-bot:', err.message);
  }
}

// Run now and then schedule
autoCommit();
cron.schedule(`*/${interval} * * * *`, autoCommit);