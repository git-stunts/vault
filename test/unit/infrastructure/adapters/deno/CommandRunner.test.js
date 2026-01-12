import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import DenoCommandRunner from '../../../../../src/infrastructure/adapters/deno/CommandRunner.js';

describe('DenoCommandRunner', () => {
  let mockOutputSync;

  beforeEach(() => {
    mockOutputSync = vi.fn(() => ({
      code: 0,
      stdout: new Uint8Array([111]),
      stderr: new Uint8Array([101])
    }));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('throws if Deno.Command is unavailable', () => {
    const runner = new DenoCommandRunner({ deno: {} });
    expect(() => runner.run('ls')).toThrow('Deno.Command is required for DenoCommandRunner');
  });

  it('uses Deno.Command.outputSync and decodes the streams', () => {
    const MockCommand = vi.fn(() => ({ outputSync: mockOutputSync }));
    const mockDeno = {
      Command: MockCommand,
      build: { os: 'linux' }
    };
    const runner = new DenoCommandRunner({ deno: mockDeno });

    const result = runner.run('cmd', ['arg'], { cwd: '/repo', env: { FOO: '1' } });

    expect(mockDeno.Command).toHaveBeenCalledWith('cmd', expect.objectContaining({
      args: ['arg'],
      cwd: '/repo',
      env: { FOO: '1' },
      stdin: 'piped',
      stdout: 'piped',
      stderr: 'piped'
    }));
    expect(mockOutputSync).toHaveBeenCalledWith(expect.objectContaining({ input: undefined }));
    expect(result.status).toBe(0);
    expect(result.stdout).toBe('o');
    expect(result.stderr).toBe('e');
  });
});
