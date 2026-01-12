/**
 * @fileoverview Vault - A secure interface to OS-native keychains.
 */

import VaultService from './src/domain/services/VaultService.js';
import VaultError from './src/domain/errors/VaultError.js';
import PlatformNotSupportedError from './src/domain/errors/PlatformNotSupportedError.js';
import SecretNotFoundError from './src/domain/errors/SecretNotFoundError.js';
import { createNodeKeychainAdapter } from './src/infrastructure/adapters/node/index.js';
import { createBunKeychainAdapter } from './src/infrastructure/adapters/bun/index.js';
import { createDenoKeychainAdapter } from './src/infrastructure/adapters/deno/index.js';

const detectAdapterFactory = ({ account }) => {
  if (typeof Bun !== 'undefined' && typeof Bun.spawnSync === 'function') {
    return createBunKeychainAdapter({ account });
  }
  if (typeof Deno !== 'undefined' && typeof Deno.Command === 'function') {
    return createDenoKeychainAdapter({ account });
  }
  return createNodeKeychainAdapter({ account });
};

export {
  VaultService,
  VaultError,
  PlatformNotSupportedError,
  SecretNotFoundError,
  createNodeKeychainAdapter,
  createBunKeychainAdapter,
  createDenoKeychainAdapter
};

/**
 * Facade class for the Vault library.
 * Maintains backward compatibility with v1.0.0.
 */
export default class Vault {
  /**
   * @param {Object} options
   * @param {string} [options.account='git-stunts']
   * @param {Object} [options.adapterFactory]
   */
  constructor({ account = 'git-stunts', adapterFactory } = {}) {
    const adapter = adapterFactory?.({ account }) ?? detectAdapterFactory({ account });
    this.service = new VaultService({ account, adapter });
  }

  get account() {
    return this.service.account;
  }

  get isMac() {
    return process.platform === 'darwin';
  }

  get isLinux() {
    return process.platform === 'linux';
  }

  get isWindows() {
    return process.platform === 'win32';
  }

  getSecret({ target }) {
    return this.service.getSecret(target);
  }

  setSecret({ target, value }) {
    this.service.setSecret(target, value);
  }

  deleteSecret({ target }) {
    return this.service.deleteSecret(target);
  }

  resolveSecret({ envKey, vaultTarget }) {
    return this.service.resolveSecret({ envKey, vaultTarget });
  }

  async ensureSecret({ target, promptMessage }) {
    return this.service.ensureSecret({ target, promptMessage });
  }
}
