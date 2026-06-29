#!/usr/bin/env node

/**
 * MSC-Projectz backup script — follows the JonBeatz ecosystem backup standard.
 * Backs up to G:\Cursor_Project_BackUpz\MSC-Projectz\ with sequential naming.
 *
 * Usage:
 *   npm run backup:quick          Standard backup (skip node_modules, .next)
 *   npm run backup:full           Full backup (everything)
 *   npm run backup                Interactive prompt
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import readline from 'node:readline';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const DEFAULT_BACKUP_ROOT = 'G:\\Cursor_Project_BackUpz\\MSC-Projectz';
const BACKUP_FOLDER_BASE = 'MSC-Projectz-Jedi-Master';
const BACKUP_FOLDER_PATTERN = /^MSC-Projectz-Jedi-Master-v(\d+)-([a-z])$/i;
const STANDARD_DIRS = ['node_modules', '.next', 'out', 'output', 'logs', 'deploy_package', '.deploy-package'];
const NOTES_PATH = path.join('.cursor', 'BackUp-Notez.md');

function getGitInfo() {
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: REPO_ROOT, encoding: 'utf8' }).trim();
    const sha = execSync('git rev-parse --short HEAD', { cwd: REPO_ROOT, encoding: 'utf8' }).trim();
    return { branch, sha };
  } catch {
    return { branch: 'unknown', sha: '0000000' };
  }
}

function getProjectVersion() {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'package.json'), 'utf8'));
    return pkg.version || '0.0.0';
  } catch {
    return '0.0.0';
  }
}

function formatBackupFolderName(version, letter) {
  return `${BACKUP_FOLDER_BASE}-v${version}-${letter}`;
}

function findLatestBackupVersion(backupRoot) {
  let maxVersion = 1;
  if (!fs.existsSync(backupRoot)) return 0;
  for (const entry of fs.readdirSync(backupRoot)) {
    const match = entry.match(BACKUP_FOLDER_PATTERN);
    if (match) {
      const v = parseInt(match[1], 10);
      if (v > maxVersion) maxVersion = v;
    }
  }
  return maxVersion;
}

function findNextLetter(backupRoot, version) {
  const prefix = `${BACKUP_FOLDER_BASE}-v${version}-`;
  if (!fs.existsSync(backupRoot)) return 'a';
  const existing = fs.readdirSync(backupRoot).filter((e) => e.startsWith(prefix));
  const letters = existing.map((e) => e.replace(prefix, '')).filter((l) => /^[a-z]$/.test(l));
  const nextCode = letters.reduce((max, l) => Math.max(max, l.charCodeAt(0)), 'a'.charCodeAt(0) - 1) + 1;
  return String.fromCharCode(nextCode);
}

function createReadline() {
  return readline.createInterface({ input: process.stdin, output: process.stdout });
}

function verifyBackupContents(backupPath) {
  const required = ['package.json', 'TRUTH.md', 'app', 'lib', 'components'];
  const missing = required.filter((r) => !fs.existsSync(path.join(backupPath, r)));
  if (missing.length > 0) {
    console.warn(`[MSC] Backup verification: missing ${missing.join(', ')}`);
    return false;
  }
  return true;
}

async function resolveBackupPlan() {
  const gitInfo = getGitInfo();
  const projectVersion = getProjectVersion();
  const backupRoot = process.env.MSC_BACKUP_ROOT?.trim() || DEFAULT_BACKUP_ROOT;

  if (!fs.existsSync(backupRoot)) {
    fs.mkdirSync(backupRoot, { recursive: true });
  }

  const latestVersion = findLatestBackupVersion(backupRoot);
  const useVersion = latestVersion === 0 ? 1 : latestVersion;
  const letter = findNextLetter(backupRoot, useVersion);
  const folderName = formatBackupFolderName(useVersion, letter);
  const backupPath = path.join(backupRoot, folderName);

  return {
    backupRoot,
    backupPath,
    folderName,
    gitInfo,
    projectVersion,
    isNewVersion: false,
    source: REPO_ROOT,
  };
}

async function runBackup(plan, isFull) {
  const { backupPath, source } = plan;

  if (fs.existsSync(backupPath)) {
    console.error(`[MSC] Backup path already exists: ${backupPath}`);
    process.exit(1);
  }

  fs.mkdirSync(backupPath, { recursive: true });

  const excludePatterns = STANDARD_DIRS.map((d) => `--exclude=${d}`).join(' ');
  const robocopyArgs = `"${source}" "${backupPath}" /E /COPY:DAT /R:1 /W:1 /NP ${isFull ? '' : excludePatterns}`;

  console.log(`[MSC] Starting backup to ${backupPath}${isFull ? ' (FULL)' : ''}`);
  console.log(`[MSC] Robocopy: ${robocopyArgs}`);

  try {
    execSync(`robocopy ${robocopyArgs}`, {
      stdio: 'inherit',
      timeout: 600000,
    });
  } catch (e) {
    // Robocopy exit codes: 0-7 are success, 8+ is error
    if (e.status >= 8) {
      throw e;
    }
  }

  // Write backup metadata
  const meta = {
    project: 'MSC-Projectz',
    version: plan.projectVersion,
    folderName: plan.folderName,
    sourceCommit: plan.gitInfo.sha,
    sourceBranch: plan.gitInfo.branch,
    timestamp: new Date().toISOString(),
    type: isFull ? 'full' : 'standard',
  };
  fs.writeFileSync(path.join(backupPath, '_backup-meta.json'), JSON.stringify(meta, null, 2));

  // Verify
  const ok = verifyBackupContents(backupPath);
  console.log(`[MSC] Backup ${ok ? 'verified OK' : 'WARNING: verification issues'} at ${backupPath}`);
  return ok;
}

async function main() {
  const rawArgs = process.argv.slice(2);
  const isFullBackup = rawArgs.includes('--full') || rawArgs.includes('-f');
  const isStandardBackup = rawArgs.includes('--standard') || rawArgs.includes('-s');
  const skipConfirm = rawArgs.includes('--yes') || rawArgs.includes('-y');
  const isDryRun = rawArgs.includes('--dry-run');

  const plan = await resolveBackupPlan();

  if (isDryRun) {
    console.log(`[MSC] Dry run: would back up to ${plan.backupPath}`);
    return;
  }

  const backupType = isFullBackup ? 'full' : (isStandardBackup ? 'standard' : null);

  if (!backupType) {
    // Interactive
    const rl = createReadline();
    const answer = await new Promise((resolve) => {
      rl.question('[MSC] Backup type? (s)tandard or (f)ull: ', (a) => {
        resolve(a.trim().toLowerCase());
        rl.close();
      });
    });
    if (answer === 'f' || answer === 'full') {
      await runBackup(plan, true);
    } else {
      await runBackup(plan, false);
    }
  } else {
    await runBackup(plan, backupType === 'full');
  }

  // Clean up old backups (keep 10 newest)
  const backupRoot = plan.backupRoot;
  if (fs.existsSync(backupRoot)) {
    const entries = fs.readdirSync(backupRoot)
      .filter((e) => BACKUP_FOLDER_PATTERN.test(e))
      .map((e) => ({
        name: e,
        time: fs.statSync(path.join(backupRoot, e)).birthtimeMs,
      }))
      .sort((a, b) => b.time - a.time);

    if (entries.length > 10) {
      const toRemove = entries.slice(10);
      for (const entry of toRemove) {
        fs.rmSync(path.join(backupRoot, entry.name), { recursive: true, force: true });
        console.log(`[MSC] Removed old backup: ${entry.name}`);
      }
    }
  }
}

main().catch((e) => {
  console.error('[MSC] Backup failed:', e.message);
  process.exit(1);
});
