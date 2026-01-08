import { describe, it, expect, vi, beforeEach } from 'vitest';
import VaultService from '../../../../src/domain/services/VaultService.js';
import KeychainAdapter from '../../../../src/infrastructure/adapters/KeychainAdapter.js';

vi.mock('../../../../src/infrastructure/adapters/KeychainAdapter.js');

describe('VaultService', () => {
  let service;
  let mockAdapter;

  beforeEach(() => {
    vi.clearAllMocks();
    mockAdapter = new KeychainAdapter('test-account');
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
});
