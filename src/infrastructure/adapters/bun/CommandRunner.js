const DECODER = new TextDecoder();

const decode = (value) => {
  if (typeof value === 'string') {
    return value;
  }
  if (value instanceof Uint8Array) {
    return DECODER.decode(value);
  }
  if (value instanceof ArrayBuffer) {
    return DECODER.decode(new Uint8Array(value));
  }
  return undefined;
};

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
      stdout: decode(result.stdout),
      stderr: decode(result.stderr)
    };
  }
}
