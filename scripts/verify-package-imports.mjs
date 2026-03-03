#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');

const run = (command, args, { cwd = repoRoot } = {}) => {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  if (result.status !== 0) {
    const output = [result.stdout, result.stderr].filter(Boolean).join('\n').trim();
    const commandString = [command, ...args].join(' ');
    throw new Error(
      `${commandString} failed with exit code ${result.status}${output ? `\n${output}` : ''}`
    );
  }

  return result.stdout.trim();
};

const writeSmokeFile = (filePath) => {
  const source = `import Vault from '@git-stunts/vault';
import VaultService from '@git-stunts/vault/service';
import { createNodeKeychainAdapter } from '@git-stunts/vault/adapters/node';
import { createBunKeychainAdapter } from '@git-stunts/vault/adapters/bun';

const checks = [
  [typeof Vault === 'function', 'Default package export must be a constructor'],
  [typeof VaultService === 'function', 'Service subpath export must be a constructor'],
  [typeof createNodeKeychainAdapter === 'function', 'Node adapter export must be a function'],
  [typeof createBunKeychainAdapter === 'function', 'Bun adapter export must be a function'],
];

for (const [ok, message] of checks) {
  if (!ok) {
    throw new Error(message);
  }
}

console.log('Package import smoke test passed.');
`;

  writeFileSync(filePath, source, 'utf8');
};

const main = () => {
  const tempRoot = mkdtempSync(path.join(tmpdir(), 'vault-pack-imports-'));

  try {
    const packDir = path.join(tempRoot, 'pack');
    const projectDir = path.join(tempRoot, 'project');
    const smokeFilePath = path.join(projectDir, 'smoke-imports.mjs');

    mkdirSync(packDir);
    mkdirSync(projectDir);

    console.log('Packing @git-stunts/vault...');
    const packOutput = run('npm', ['pack', '--pack-destination', packDir], {
      cwd: repoRoot,
    });
    const tarballName = packOutput
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .at(-1);

    if (!tarballName) {
      throw new Error('npm pack did not produce a tarball name');
    }

    const tarballPath = path.join(packDir, tarballName);

    writeFileSync(
      path.join(projectDir, 'package.json'),
      `${JSON.stringify(
        {
          name: 'vault-pack-import-smoke',
          private: true,
          type: 'module',
        },
        null,
        2
      )}\n`,
      'utf8'
    );

    console.log(`Installing ${tarballName} in temp project...`);
    run('npm', ['install', '--no-audit', '--no-fund', tarballPath], {
      cwd: projectDir,
    });

    writeSmokeFile(smokeFilePath);

    console.log('Running ESM import smoke test...');
    run('node', [smokeFilePath], { cwd: projectDir });

    console.log('Pack import verification succeeded.');
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
};

try {
  main();
} catch (error) {
  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(error);
  }
  process.exitCode = 1;
}
