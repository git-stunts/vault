import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import readline from 'node:readline';
import VaultService from '../../../../src/domain/services/VaultService.js';
vi.mock('node:readline');

describe('VaultService', () => {
  let service;
  let mockAdapter;

  beforeEach(() => {
    vi.clearAllMocks();
    mockAdapter = {
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn()
    };
    service = new VaultService({ account: 'test-account', adapter: mockAdapter });
  });

  it('gets a secret via adapter', () => {
    mockAdapter.get.mockReturnValue('secret-value');
    const result = service.getSecret('my-target');
    expect(result).toBe('secret-value');
    expect(mockAdapter.get).toHaveBeenCalledWith('my-target');
  });

  it('throws error if target missing in getSecret', () => {
    expect(() => service.getSecret('')).toThrow('target is required');
  });

  it('sets a secret via adapter', () => {
    mockAdapter.set.mockReturnValue(true);
    service.setSecret('target', 'value');
    expect(mockAdapter.set).toHaveBeenCalledWith('target', 'value');
  });

  it('throws error if setSecret fails', () => {
    mockAdapter.set.mockReturnValue(false);
    expect(() => service.setSecret('target', 'value')).toThrow('Failed to store secret');
  });

  it('resolves secret from environment variable', () => {
    process.env.TEST_ENV_VAR = 'env-secret';
    const result = service.resolveSecret({ envKey: 'TEST_ENV_VAR', vaultTarget: 'vault-target' });
    expect(result).toBe('env-secret');
    expect(mockAdapter.get).not.toHaveBeenCalled();
    delete process.env.TEST_ENV_VAR;
  });

  it('resolves secret from vault if env var missing', () => {
    mockAdapter.get.mockReturnValue('vault-secret');
    const result = service.resolveSecret({ envKey: 'MISSING_VAR', vaultTarget: 'vault-target' });
    expect(result).toBe('vault-secret');
    expect(mockAdapter.get).toHaveBeenCalledWith('vault-target');
  });

  describe('ensureSecret', () => {
    let originalIsTTY;

    beforeEach(() => {
      originalIsTTY = process.stdin.isTTY;
    });

    afterEach(() => {
      if (originalIsTTY === undefined) {
        delete process.stdin.isTTY;
      } else {
        Object.defineProperty(process.stdin, 'isTTY', {
          value: originalIsTTY,
          configurable: true,
          writable: true,
          enumerable: true
        });
      }
      vi.restoreAllMocks();
    });

    it('returns value immediately if it exists in vault', async () => {
      mockAdapter.get.mockReturnValue('existing-secret');
      const result = await service.ensureSecret({ target: 'my-key', promptMessage: 'Enter key' });
      expect(result).toBe('existing-secret');
      expect(mockAdapter.get).toHaveBeenCalledWith('my-key');
    });

    it('throws error if missing and not a TTY', async () => {
      mockAdapter.get.mockReturnValue(undefined);
      Object.defineProperty(process.stdin, 'isTTY', {
        value: false,
        configurable: true,
        writable: true,
        enumerable: true
      });
      
      await expect(service.ensureSecret({ target: 'my-key', promptMessage: 'Enter key' }))
        .rejects.toThrow('Secret my-key missing and no TTY for prompt');
    });

    it('prompts user and returns secret when successful', async () => {
      mockAdapter.get.mockReturnValue(undefined);
      mockAdapter.set.mockReturnValue(true);
      Object.defineProperty(process.stdin, 'isTTY', {
        value: true,
        configurable: true,
        writable: true,
        enumerable: true
      });

      let questionCallback;
      const mockRl = {
        question: vi.fn((prompt, callback) => { questionCallback = callback; }),
        close: vi.fn(),
        output: { write: vi.fn() }
      };
      readline.createInterface.mockReturnValue(mockRl);
      
      const stderrWriteSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => {});

      const promise = service.ensureSecret({ target: 'my-key', promptMessage: 'Enter key' });

      // Test _writeToOutput while muted
      expect(mockRl.stdoutMuted).toBe(true);
      mockRl._writeToOutput('secret');
      expect(mockRl.output.write).toHaveBeenCalledWith('*');

      // Now trigger the callback
      questionCallback('  new-secret  ');

      const result = await promise;

      expect(result).toBe('new-secret');
      expect(mockAdapter.set).toHaveBeenCalledWith('my-key', 'new-secret');
      expect(mockRl.close).toHaveBeenCalled();
      expect(stderrWriteSpy).toHaveBeenCalledWith('\n');

      // Test _writeToOutput while unmuted
      expect(mockRl.stdoutMuted).toBe(false);
      mockRl._writeToOutput('visible');
      expect(mockRl.output.write).toHaveBeenCalledWith('visible');

      stderrWriteSpy.mockRestore();
    });

    it('rejects if prompt returns empty secret', async () => {
      mockAdapter.get.mockReturnValue(undefined);
      Object.defineProperty(process.stdin, 'isTTY', {
        value: true,
        configurable: true,
        writable: true,
        enumerable: true
      });

      const mockRl = {
        question: vi.fn((prompt, callback) => callback('   ')),
        close: vi.fn(),
        output: { write: vi.fn() }
      };
      readline.createInterface.mockReturnValue(mockRl);
      
      const stderrWriteSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => {});

      await expect(service.ensureSecret({ target: 'my-key', promptMessage: 'Enter key' }))
        .rejects.toThrow('Secret cannot be empty');

      expect(mockRl.close).toHaveBeenCalled();
      expect(stderrWriteSpy).toHaveBeenCalledWith('\n');

      stderrWriteSpy.mockRestore();
    });

    it('rejects if setSecret fails', async () => {
      mockAdapter.get.mockReturnValue(undefined);
      mockAdapter.set.mockReturnValue(false); // setSecret will throw
      Object.defineProperty(process.stdin, 'isTTY', {
        value: true,
        configurable: true,
        writable: true,
        enumerable: true
      });

      const mockRl = {
        question: vi.fn((prompt, callback) => callback('some-secret')),
        close: vi.fn(),
        output: { write: vi.fn() }
      };
      readline.createInterface.mockReturnValue(mockRl);
      
      const stderrWriteSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => {});

      await expect(service.ensureSecret({ target: 'my-key', promptMessage: 'Enter key' }))
        .rejects.toThrow('Failed to store secret');

      expect(mockRl.close).toHaveBeenCalled();
      expect(stderrWriteSpy).toHaveBeenCalledWith('\n');

      stderrWriteSpy.mockRestore();
    });
  });
});
