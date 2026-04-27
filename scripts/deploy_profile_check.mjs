import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const TEMPLATE = path.join(ROOT, '.cursor', 'docs', 'Deploy-Profile.template.json');
const LOCAL = path.join(ROOT, '.cursor', 'docs', 'Deploy-Profile.local.json');
const PACKAGE_JSON = path.join(ROOT, 'package.json');
const DEPLOY_SCRIPT = path.join(ROOT, 'msc_package_deploy.mjs');

function fail(message) {
  console.error(`[deploy-preflight] ERROR: ${message}`);
  process.exitCode = 1;
}

function warn(message) {
  console.warn(`[deploy-preflight] WARN: ${message}`);
}

function info(message) {
  console.log(`[deploy-preflight] ${message}`);
}

function readJson(filePath) {
  if (!existsSync(filePath)) {
    return null;
  }
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function deepMerge(base, override) {
  if (!override) return base;
  const out = { ...base };
  for (const [key, value] of Object.entries(override)) {
    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      out[key] &&
      typeof out[key] === 'object' &&
      !Array.isArray(out[key])
    ) {
      out[key] = deepMerge(out[key], value);
    } else {
      out[key] = value;
    }
  }
  return out;
}

function getPathParts(obj, parts) {
  let current = obj;
  for (const part of parts) {
    if (current == null || !(part in current)) return undefined;
    current = current[part];
  }
  return current;
}

function assertRequired(profile, pathParts) {
  const value = getPathParts(profile, pathParts);
  if (
    value === undefined ||
    value === null ||
    (typeof value === 'string' && value.trim() === '')
  ) {
    fail(`Missing deploy profile value: ${pathParts.join('.')}`);
  }
}

function scanForAbsolutePathRisk() {
  const targets = [
    path.join(ROOT, 'collections', 'MSC-Projectz-Media.ts'),
    path.join(ROOT, 'payload.config.ts'),
  ];

  const absolutePattern = /staticDir\s*:\s*['"`](\/|[A-Za-z]:\\|[A-Za-z]:\/)/;
  for (const target of targets) {
    if (!existsSync(target)) continue;
    const content = readFileSync(target, 'utf8');
    if (absolutePattern.test(content)) {
      fail(`Absolute media staticDir detected in ${path.relative(ROOT, target)}`);
    }
  }
}

function checkDeployScriptExpectations() {
  if (!existsSync(DEPLOY_SCRIPT)) {
    fail('Missing msc_package_deploy.mjs');
    return;
  }
  const deployContent = readFileSync(DEPLOY_SCRIPT, 'utf8');
  const mustContain = ['payload.sqlite', "from: 'media'", 'final_deploy.zip'];
  for (const token of mustContain) {
    if (!deployContent.includes(token)) {
      fail(`Deploy script missing expected token: ${token}`);
    }
  }
}

function checkPackageScripts(requiredScripts) {
  const pkg = readJson(PACKAGE_JSON);
  if (!pkg) {
    fail('Missing package.json');
    return;
  }
  const scripts = pkg.scripts || {};
  for (const scriptName of requiredScripts) {
    if (!scripts[scriptName]) {
      fail(`Missing package.json script: ${scriptName}`);
    }
  }
}

function main() {
  const template = readJson(TEMPLATE);
  if (!template) {
    fail('Missing .cursor/docs/Deploy-Profile.template.json');
    return;
  }
  const local = readJson(LOCAL);
  const profile = deepMerge(template, local);

  assertRequired(profile, ['profileVersion']);
  assertRequired(profile, ['project', 'name']);
  assertRequired(profile, ['project', 'domain']);
  assertRequired(profile, ['deployment', 'artifactFile']);
  assertRequired(profile, ['deployment', 'localBuildCommand']);
  assertRequired(profile, ['host', 'ftpHost']);
  assertRequired(profile, ['host', 'ftpPort']);
  assertRequired(profile, ['host', 'remoteAppRoot']);
  assertRequired(profile, ['host', 'nodevenvActivatePath']);
  assertRequired(profile, ['pathsPolicy', 'allowedMediaRoot']);

  if (!local) {
    warn(
      'Deploy-Profile.local.json not found. Using template only. Add local override for account-specific values.',
    );
  }

  if (
    String(profile.host.ftpUsername || '').includes('<set-in-local-override>')
  ) {
    warn('ftpUsername is still template placeholder. Set it in Deploy-Profile.local.json.');
  }

  checkPackageScripts(profile.checks?.requiredPackageScripts || []);
  checkDeployScriptExpectations();
  scanForAbsolutePathRisk();

  if (!process.exitCode) {
    info('Preflight passed: deploy profile, scripts, and path policy look good.');
  }
}

main();
