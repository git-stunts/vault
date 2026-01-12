/**
 * @fileoverview Vault - A secure interface to OS-native keychains.
 */

import VaultService from './src/domain/services/VaultService.js';
import VaultError from './src/domain/errors/VaultError.js';
import PlatformNotSupportedError from './src/domain/errors/PlatformNotSupportedError.js';
import SecretNotFoundError from './src/domain/errors/SecretNotFoundError.js';

export {
  VaultService,
  VaultError,
  PlatformNotSupportedError,
  SecretNotFoundError
};

/**
 * Facade class for the Vault library.
 * Maintains backward compatibility with v1.0.0.
 */
export default class Vault {
  /**
   * @param {Object} options
   * @param {string} [options.account='git-stunts']
   */
  constructor({ account = 'git-stunts' } = {}) {
    this.service = new VaultService({ account });
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