import { describe, it, expect, vi, beforeEach } from 'vitest';
import BunCommandRunner from '../../../../../src/infrastructure/adapters/bun/CommandRunner.js';

describe('BunCommandRunner', () => {
  let runner;
  let bunMock;

  beforeEach(() => {
    bunMock = { spawnSync: vi.fn() };
    runner = new BunCommandRunner({ bun: bunMock });
  });

  it('throws if Bun.spawnSync is missing', () => {
    const failRunner = new BunCommandRunner({ bun: {} });
    expect(() => failRunner.run('cmd')).toThrow('Bun.spawnSync is required for BunCommandRunner');
  });

  it('runs commands with Bun.spawnSync and decodes output', () => {
    bunMock.spawnSync.mockReturnValue({
      exitCode: 0,
      stdout: new Uint8Array([111, 107]),
      stderr: 'error'
    });

    const result = runner.run('cmd', ['arg'], { cwd: '/repo', env: { FOO: '1' } });

    expect(bunMock.spawnSync).toHaveBeenCalledWith(
      ['cmd', 'arg'],
      expect.objectContaining({ cwd: '/repo', env: { FOO: '1' } })
    );
    expect(result.status).toBe(0);
    expect(result.stdout).toBe('ok');
    expect(result.stderr).toBe('error');
  });
});
