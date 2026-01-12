import { describe, it, expect, vi, beforeEach } from 'vitest';
import { spawnSync } from 'node:child_process';
import KeychainAdapter from '../../../../src/infrastructure/adapters/KeychainAdapter.js';

vi.mock('node:child_process', () => ({
  spawnSync: vi.fn()
}));

describe('KeychainAdapter', () => {
  let adapter;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('win32 platform', () => {
    beforeEach(() => {
      adapter = new KeychainAdapter('my-account');
      vi.spyOn(adapter, 'platform', 'get').mockReturnValue('win32');
    });

    it('escapes account and other values in set() PowerShell script', () => {
      spawnSync.mockReturnValue({ status: 0 });
      
      const target = "my'target";
      const value = "my'password";
      adapter.account = "my'account";
      
      adapter.set(target, value);
      
      expect(spawnSync).toHaveBeenCalledWith('powershell', expect.any(Array));
      const args = spawnSync.mock.calls[0][1];
      const script = args[2];
      expect(script).toContain("-Target 'my''target'");
      expect(script).toContain("-UserName 'my''account'");
      expect(script).toContain("$pwd = 'my''password'");
    });

    it('escapes target in delete() PowerShell script', () => {
      spawnSync.mockReturnValue({ status: 0 });
      
      const target = "my'target";
      adapter.delete(target);
      
      expect(spawnSync).toHaveBeenCalledWith('powershell', expect.any(Array));
      const args = spawnSync.mock.calls[0][1];
      const script = args[2];
      expect(script).toContain("-Target 'my''target'");
    });

    it('escapes target in get() PowerShell script', () => {
      spawnSync.mockReturnValue({ status: 0, stdout: 'password' });
      
      const target = "my'target";
      adapter.get(target);
      
      expect(spawnSync).toHaveBeenCalledWith('powershell', expect.any(Array), expect.any(Object));
      const args = spawnSync.mock.calls[0][1];
      const script = args[2];
      expect(script).toContain("-Target 'my''target'");
    });
  });

  describe('darwin platform', () => {
    beforeEach(() => {
      adapter = new KeychainAdapter('my-account');
      vi.spyOn(adapter, 'platform', 'get').mockReturnValue('darwin');
    });

    it('calls security command in get()', () => {
      spawnSync.mockReturnValue({ status: 0, stdout: 'password' });
      const result = adapter.get('my-target');
      expect(result).toBe('password');
      expect(spawnSync).toHaveBeenCalledWith(
        'security',
        ['find-generic-password', '-a', 'my-account', '-s', 'my-target', '-w'],
        expect.any(Object)
      );
    });
  });
});
