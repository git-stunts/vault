import { decodeValue } from '../shared/decode.js';

export default class BunCommandRunner {
  constructor({ bun } = {}) {
    this.bun = bun ?? globalThis?.Bun;
  }

  run(command, args = [], options = {}) {
    if (!this.bun || typeof this.bun.spawnSync !== 'function') {
      throw new Error('Bun.spawnSync is required for BunCommandRunner');
    }

    const spawnArgs = [command, ...args];
    const spawnOptions = {
      cwd: options.cwd,
      env: options.env,
      stdin: 'pipe',
      stdout: 'pipe',
      stderr: 'pipe'
    };

    if (options.input) {
      spawnOptions.input = options.input;
    }

    const result = this.bun.spawnSync(spawnArgs, spawnOptions);
    const status = typeof result.exitCode === 'number' ? result.exitCode : result.status;

    return {
      status,
    stdout: decodeValue(result.stdout),
    stderr: decodeValue(result.stderr)
  };
}
}
