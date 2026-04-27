/**
 * MSC-Projectz — Production Deployer
 * 1. Validates critical production files.
 * 2. Runs 'npm run build' (local).
 * 3. Copies artifacts to 'deploy_package' (Excludes node_modules).
 * 4. Zips to 'final_deploy.zip'.
 */
import { spawnSync } from 'node:child_process';
import { copyFile, cp, mkdir, rm } from 'node:fs/promises';
import { existsSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.dirname(__filename);
const STAGE = path.join(ROOT, 'deploy_package');
const ZIP_OUT = path.join(ROOT, 'final_deploy.zip');

const COPY_PLAN = [
  { from: '.next', type: 'dir' },
  { from: 'public', type: 'dir' },
  { from: 'media', type: 'dir' },
  { from: 'app', type: 'dir' },
  { from: 'collections', type: 'dir' },
  { from: 'components', type: 'dir' },
  { from: 'lib', type: 'dir' },
  { from: 'types', type: 'dir' },
  { from: 'server.js', type: 'file' },
  { from: 'payload.config.ts', type: 'file' },
  { from: 'next.config.mjs', type: 'file' },
  { from: 'tsconfig.json', type: 'file' },
  { from: '.env', type: 'file' },
  { from: 'package.json', type: 'file' },
  { from: 'payload.sqlite', type: 'file' },
  { from: 'unzip.php', type: 'file' },
];

function msc_log(step, message) { console.log(`[${step}] ${message}`); }

// Pre-flight check to prevent bad deployments
function msc_validate() {
  const REQUIRED = ['server.js', '.env', 'payload.sqlite'];
  msc_log('check', 'Running pre-flight validation...');
  
  for (const file of REQUIRED) {
    if (!existsSync(path.join(ROOT, file))) {
      console.error(`\x1b[31m[ERROR]\x1b[0m Missing critical file: ${file}`);
      process.exit(1); 
    }
  }
  msc_log('check', 'Validation passed. All critical files present.');
}

async function msc_stage() {
  msc_log('stage', 'Cleaning and preparing deploy_package...');
  
  // Nuke the old staging area
  if (existsSync(STAGE)) rmSync(STAGE, { recursive: true, force: true });
  await mkdir(STAGE, { recursive: true });

  for (const item of COPY_PLAN) {
    const srcPath = path.join(ROOT, item.from);
    if (!existsSync(srcPath)) {
      msc_log('warn', `skip (missing): ${item.from}`);
      continue;
    }
    
    const destPath = path.join(STAGE, item.from);
    await mkdir(path.dirname(destPath), { recursive: true });

    if (item.type === 'dir') {
      await cp(srcPath, destPath, { recursive: true, dereference: true });
      msc_log('copy', `folder: ${item.from}/`);
    } else {
      await copyFile(srcPath, destPath);
      msc_log('copy', `file: ${item.from}`);
    }
  }
}

function msc_zip() {
  if (existsSync(ZIP_OUT)) rmSync(ZIP_OUT, { force: true });
  msc_log('zip', 'Compressing to final_deploy.zip...');
  
  if (process.platform === 'win32') {
    const ps = `Compress-Archive -Path "${STAGE}\\*" -DestinationPath "${ZIP_OUT}" -Force`;
    spawnSync('powershell.exe', ['-Command', ps], { stdio: 'inherit' });
  } else {
    spawnSync('zip', ['-r', '-q', ZIP_OUT, '.'], { cwd: STAGE, stdio: 'inherit' });
  }
  msc_log('done', 'Deployment package created: final_deploy.zip');
}

async function msc_main() {
  // 0. Pre-flight Check
  msc_validate();

  // 1. Build
  msc_log('start', 'Building project (No node_modules install)...');
  msc_log('build', 'Running npm run build...');
  const buildResult = spawnSync('npm', ['run', 'build'], { stdio: 'inherit', shell: true });
  
  if (buildResult.status !== 0) {
    console.error('\x1b[31m[ERROR]\x1b[0m Build failed. Aborting deployment.');
    process.exit(1);
  }

  // 2. Stage
  await msc_stage();

  // 3. Zip
  msc_zip();
}

msc_main().catch(err => {
  console.error('\x1b[31m[CRITICAL]\x1b[0m Deployment process crashed:', err);
  process.exit(1);
});