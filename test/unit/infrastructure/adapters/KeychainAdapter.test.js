import { describe, it, expect, vi, beforeEach } from 'vitest';
import KeychainAdapter from '../../../../src/infrastructure/adapters/KeychainAdapter.js';

describe('KeychainAdapter', () => {
  let adapter;
  let runner;

  beforeEach(() => {
    vi.clearAllMocks();
    runner = { run: vi.fn() };
  });

  describe('win32 platform', () => {
    beforeEach(() => {
      adapter = new KeychainAdapter({
        account: 'my-account',
        commandRunner: runner,
        platformGetter: () => 'win32'
      });
    });

    it('escapes values in set() PowerShell script', () => {
      runner.run.mockReturnValue({ status: 0 });
      const target = "my'target";
      const value = "my'password";
      adapter.account = "my'account";

      adapter.set(target, value);

      expect(runner.run).toHaveBeenCalledWith('powershell', expect.any(Array));
      const args = runner.run.mock.calls[0][1];
      const script = args[2];
      expect(script).toContain("-Target 'my''target'");
      expect(script).toContain("-UserName 'my''account'");
      expect(script).toContain("$pwd = 'my''password'");
    });

    it('escapes target in delete() PowerShell script', () => {
      runner.run.mockReturnValue({ status: 0 });
      const target = "my'target";

      adapter.delete(target);

      expect(runner.run).toHaveBeenCalledWith('powershell', expect.any(Array));
      const script = runner.run.mock.calls[0][1][2];
      expect(script).toContain("-Target 'my''target'");
    });

    it('escapes target in get() PowerShell script', () => {
      runner.run.mockReturnValue({ status: 0, stdout: 'password' });
      const target = "my'target";

      adapter.get(target);

      expect(runner.run).toHaveBeenCalledWith('powershell', expect.any(Array));
      const script = runner.run.mock.calls[0][1][2];
      expect(script).toContain("-Target 'my''target'");
    });
  });

  describe('darwin platform', () => {
    beforeEach(() => {
      adapter = new KeychainAdapter({
        account: 'my-account',
        commandRunner: runner,
        platformGetter: () => 'darwin'
      });
    });

    it('calls security command in get()', () => {
      runner.run.mockReturnValue({ status: 0, stdout: ' password\n' });
      const result = adapter.get('my-target');
      expect(result).toBe('password');
      expect(runner.run).toHaveBeenCalledWith(
        'security',
        ['find-generic-password', '-a', 'my-account', '-s', 'my-target', '-w'],
        expect.objectContaining({ stdio: ['ignore', 'pipe', 'ignore'] })
      );
    });
  });
});
