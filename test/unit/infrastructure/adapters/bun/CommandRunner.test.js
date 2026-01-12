import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import BunCommandRunner from '../../../../src/infrastructure/adapters/bun/CommandRunner.js';

describe('BunCommandRunner', () => {
  let runner;
  let originalBun;

  beforeEach(() => {
    originalBun = globalThis.Bun;
    globalThis.Bun = { spawnSync: vi.fn() };
    runner = new BunCommandRunner();
  });

  afterEach(() => {
    globalThis.Bun = originalBun;
    vi.clearAllMocks();
  });

  it('throws if Bun.spawnSync is missing', () => {
    globalThis.Bun = undefined;
    expect(() => runner.run('cmd')).toThrow('Bun.spawnSync is required for BunCommandRunner');
  });

  it('runs commands with Bun.spawnSync and decodes output', () => {
    globalThis.Bun.spawnSync.mockReturnValue({
      exitCode: 0,
      stdout: new Uint8Array([111, 107]),
      stderr: 'error'
    });

    const result = runner.run('cmd', ['arg'], { cwd: '/repo', env: { FOO: '1' } });

    expect(globalThis.Bun.spawnSync).toHaveBeenCalledWith(
      ['cmd', 'arg'],
      expect.objectContaining({ cwd: '/repo', env: { FOO: '1' } })
    );
    expect(result.status).toBe(0);
    expect(result.stdout).toBe('ok');
    expect(result.stderr).toBe('error');
  });
});
