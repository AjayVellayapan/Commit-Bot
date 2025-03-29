#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');
const simpleGit = require('simple-git');
const cron = require('node-cron');
const fse = require('fs-extra');

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

async function autoCommit() {
  try {
    const tempDir = path.join(os.tmpdir(), `commit-bot-${Date.now()}`);
    const repoPath = process.cwd();

    // Gather uncommitted changes from source repo
    const sourceGit = simpleGit(repoPath);
    const status = await sourceGit.status();
    const uncommittedFiles = status.files.map(f => f.path);

    const uncommittedBackupDir = path.join(os.tmpdir(), `commit-bot-uncommitted-${Date.now()}`);
    fse.ensureDirSync(uncommittedBackupDir);
    for (const file of uncommittedFiles) {
      const src = path.join(repoPath, file);
      const dest = path.join(uncommittedBackupDir, file);
      if (fs.existsSync(src)) {
        fse.ensureDirSync(path.dirname(dest));
        fse.copySync(src, dest);
      }
    }

    // Clone the repo using shared objects for speed
    execSync(`git clone --quiet --shared . "${tempDir}"`, { cwd: repoPath });

    const git = simpleGit({ baseDir: tempDir });
    await git.fetch();

    const branches = await git.branch();
    if (!branches.all.includes(`remotes/origin/${mirrorBranch}`)) {
      await git.checkoutLocalBranch(mirrorBranch);
      await git.push(['-u', 'origin', mirrorBranch]);
    } else {
      await git.checkout(mirrorBranch);
      await git.pull('origin', mirrorBranch);
    }

    // Merge source branch
    await git.mergeFromTo(sourceBranch, mirrorBranch);

    // Apply uncommitted changes from source repo
    for (const file of uncommittedFiles) {
      const src = path.join(uncommittedBackupDir, file);
      const dest = path.join(tempDir, file);
      if (fs.existsSync(src)) {
        fse.ensureDirSync(path.dirname(dest));
        fse.copySync(src, dest);
      }
    }

    if (uncommittedFiles.length > 0) {
      await git.add('.');
      await git.commit(`Commit-bot: uncommitted changes from '${sourceBranch}' at ${new Date().toLocaleString()}`);
    }

    await git.push('origin', mirrorBranch);

    fs.writeFileSync(LAST_RUN_LOG, new Date().toLocaleString());
    console.log(`✅ '${mirrorBranch}' is now up-to-date or ahead of '${sourceBranch}' at ${new Date().toLocaleString()}`);

    fse.removeSync(tempDir);
    fse.removeSync(uncommittedBackupDir);
  } catch (err) {
    console.error('❌ Error during commit-bot:', err.message);
  }
}

// Run now and then schedule
autoCommit();
cron.schedule(`*/${interval} * * * *`, autoCommit);