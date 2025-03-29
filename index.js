#!/usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer').default;
const { execSync } = require('child_process');
const pkg = require('./package.json');

const program = new Command();

const CONFIG_DIR = path.join(process.cwd(), '.commit-bot');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');
const WORKER_PATH = path.join(__dirname, 'worker.js');

function isGitRepo() {
  return fs.existsSync(path.join(process.cwd(), '.git'));
}

function ensureConfigDir() {
  if (!fs.existsSync(CONFIG_DIR)) fs.mkdirSync(CONFIG_DIR);
  const gitignorePath = path.join(CONFIG_DIR, '.gitignore');
  fs.writeFileSync(gitignorePath, '*\n');
}

program
  .name('commit-bot')
  .description('Auto commit and push current branch on a schedule')
  .version(pkg.version);

program
  .command('init')
  .description('Initialize commit-bot in the current repo')
  .action(async () => {
    if (!isGitRepo()) {
      console.log(chalk.red('Not a git repository.'));
      return;
    }

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'interval',
        message: 'Commit interval (in minutes)?',
        default: '30',
        validate: input => isNaN(Number(input)) ? 'Must be a number' : true
      }
    ]);

    ensureConfigDir();
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(answers, null, 2));
    console.log(chalk.green('Commit-bot configured! Run `commit-bot start` to begin.'));
  });

program
  .command('start')
  .description('Start auto-committing in the background')
  .action(() => {
    if (!fs.existsSync(CONFIG_FILE)) {
      console.log(chalk.red('No config found. Run `commit-bot init` first.'));
      return;
    }

    try {
      execSync(`pm2 start ${WORKER_PATH} --name commit-bot-${path.basename(process.cwd())}`);
      console.log(chalk.green('Commit-bot started!'));
    } catch (err) {
      console.log(chalk.red('Failed to start background process. Make sure PM2 is installed globally with `npm install -g pm2`.'));
    }
  });

program
  .command('stop')
  .description('Stop auto-committing')
  .action(() => {
    try {
      execSync(`pm2 stop commit-bot-${path.basename(process.cwd())}`);
      execSync(`pm2 delete commit-bot-${path.basename(process.cwd())}`);
      console.log(chalk.yellow('Commit-bot stopped.'));
    } catch (err) {
      console.log(chalk.red('Failed to stop process. It may not be running.'));
    }
  });

program
  .command('status')
  .description('Check commit-bot status')
  .action(() => {
    try {
      const output = execSync(`pm2 show commit-bot-${path.basename(process.cwd())}`).toString();
      console.log(chalk.blue(output));
    } catch {
      console.log(chalk.red('Commit-bot is not running.'));
    }

    const lastRun = path.join(CONFIG_DIR, 'last-run.log');
    if (fs.existsSync(lastRun)) {
      const log = fs.readFileSync(lastRun, 'utf-8');
      console.log(chalk.green(`Last commit: ${log}`));
    }
  });

program.parse(process.argv);