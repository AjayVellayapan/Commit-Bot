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
const mirrorBranch = config.branch;
const sourceBranch = config.track || 'main';
const git = simpleGit();

async function autoCommit() {
  try {
    const status = await git.status();
    const currentBranch = status.current;

    const tempDir = path.join(os.tmpdir(), `commit-bot-${Date.now()}`);
    fse.ensureDirSync(tempDir);

    const trackedFiles = status.tracking ? status.files.map(f => f.path) : [];

    // Backup tracked but uncommitted files
    for (const file of trackedFiles) {
      const fullPath = path.join(process.cwd(), file);
      const destPath = path.join(tempDir, file);
      fse.ensureDirSync(path.dirname(destPath));
      if (fs.existsSync(fullPath)) {
        fse.copySync(fullPath, destPath);
      }
    }

    const hasChanges = status.files.length > 0;
    if (hasChanges) await git.stash();

    // Ensure mirror branch exists and fetch latest
    const branches = await git.branch();
    if (!branches.all.includes(`remotes/origin/${mirrorBranch}`)) {
      await git.checkoutLocalBranch(mirrorBranch);
      await git.push(['-u', 'origin', mirrorBranch]);
    } else {
      await git.fetch();
    }

    // Checkout mirror branch
    await git.checkout(mirrorBranch);
    await git.mergeFromTo(sourceBranch, mirrorBranch);
    await git.push('origin', mirrorBranch);

    fs.writeFileSync(LAST_RUN_LOG, new Date().toLocaleString());
    console.log(`Mirror branch '${mirrorBranch}' updated from '${sourceBranch}' at ${new Date().toLocaleString()}`);

    // Return to original branch and reapply uncommitted changes
    await git.checkout(currentBranch);
    if (hasChanges) await git.stash(['pop']);

    fse.removeSync(tempDir);
  } catch (err) {
    console.error('Error during commit-bot:', err.message);
  }
}

// Run now and then schedule
autoCommit();
cron.schedule(`*/${interval} * * * *`, autoCommit);
