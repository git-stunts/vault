#!/usr/bin/env node
import { spawn, spawnSync } from 'child_process';

const services = ['node-test', 'bun-test', 'deno-test'];

const runCommand = (cmd, args, options = {}) =>
  new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: 'inherit', ...options });
    child.on('error', reject);
    child.on('exit', (code) => resolve(code ?? 0));
  });

const detectDockerCompose = () => {
  const tryCmd = (command, args) => {
    try {
      const result = spawnSync(command, args, { stdio: 'ignore' });
      if (result && result.status === 0) {
        return true;
      }
    } catch (error) {
      // ignore
    }
    return false;
  };

  if (tryCmd('docker', ['compose', 'version'])) {
    return { command: 'docker', argsPrefix: ['compose'] };
  }

  if (tryCmd('docker-compose', ['version'])) {
    return { command: 'docker-compose', argsPrefix: [] };
  }

  return null;
};

const runMultiRuntimeTests = async () => {
  console.log('🚀 Starting multi-runtime Docker tests for vault...');
  const docker = detectDockerCompose();
  if (!docker) {
    console.error('❌ docker compose not found');
    process.exitCode = 1;
    return;
  }

  const upArgs = [...docker.argsPrefix, 'up', '--build', '--remove-orphans'];
  const upCode = await runCommand(docker.command, upArgs);
  if (upCode !== 0) {
    console.error('❌ docker compose up failed', upCode);
    const downArgs = [...docker.argsPrefix, 'down'];
    spawnSync(docker.command, downArgs, { stdio: 'inherit' });
    process.exitCode = upCode;
    return;
  }

  let exitCode = 0;
  for (const service of services) {
    const psArgs = [...docker.argsPrefix, 'ps', '-a', '--format', '{{.ExitCode}}', service];
    const result = spawnSync(docker.command, psArgs, { encoding: 'utf8' });
    const status = result.stdout ? parseInt(result.stdout.trim(), 10) : NaN;
    if (Number.isNaN(status)) {
      console.log(`❓ ${service} status unknown`);
      exitCode = 1;
      continue;
    }
    if (status !== 0) {
      console.log(`❌ ${service} failed with exit code ${status}`);
      exitCode = 1;
    } else {
      console.log(`✅ ${service} passed`);
    }
  }

  const downArgs = [...docker.argsPrefix, 'down'];
  spawnSync(docker.command, downArgs, { stdio: 'inherit' });

  process.exitCode = exitCode;
};

const runLocalTests = async () => {
  const extraArgs = process.argv.slice(2);
    const args = ['exec', 'vitest', 'run', 'test/unit', ...extraArgs];
    const code = await runCommand('npm', args);
  process.exitCode = code;
};

const main = async () => {
  if (process.env.GIT_STUNTS_DOCKER === '1') {
    await runLocalTests();
    return;
  }
  await runMultiRuntimeTests();
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
