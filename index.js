/**
 * @fileoverview Vault - A secure interface to OS-native keychains.
 */

import VaultService from './src/domain/services/VaultService.js';
import VaultError from './src/domain/errors/VaultError.js';
import PlatformNotSupportedError from './src/domain/errors/PlatformNotSupportedError.js';
import SecretNotFoundError from './src/domain/errors/SecretNotFoundError.js';
import { createBunKeychainAdapter } from './src/infrastructure/adapters/bun/index.js';
import { createDenoKeychainAdapter } from './src/infrastructure/adapters/deno/index.js';

const isNodeRuntime =
  typeof process !== 'undefined' &&
  typeof process.versions?.node === 'string' &&
  process.release?.name === 'node';

let nodeRequire;
if (isNodeRuntime) {
  const { createRequire } = await import('module');
  nodeRequire = createRequire(import.meta.url);
}

const loadNodeAdapterModule = () => {
  if (!nodeRequire) {
    throw new Error('Node runtime is required for the Node keychain adapter');
  }
  return nodeRequire('./src/infrastructure/adapters/node/index.js');
};

/**
 * Create a keychain adapter backed by the Node runtime.
 * @param {Object} [options]
 * @param {string} [options.account] - Account/scope for the secrets.
 * @returns {KeychainAdapter}
 */
export function createNodeKeychainAdapter(options) {
  return loadNodeAdapterModule().createNodeKeychainAdapter(options);
}

/**
 * Detect the environment and instantiate the matching keychain adapter.
 * @param {Object} params
 * @param {string} [params.account]
 * @returns {KeychainAdapter}
 */
const detectAdapter = ({ account }) => {
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
   * @param {Function} [options.adapterFactory]
   */
  constructor({ account = 'git-stunts', adapterFactory } = {}) {
    if (adapterFactory != null && typeof adapterFactory !== 'function') {
      throw new TypeError('adapterFactory must be a function');
    }
    const adapter =
      adapterFactory ? adapterFactory({ account }) : detectAdapter({ account });
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

  /**
   * Remove the secret for the requested target.
   * @param {Object} params
   * @param {string} params.target
   * @returns {boolean}
   */
  deleteSecret({ target }) {
    return this.service.deleteSecret(target);
  }

  /**
   * Resolve a value from the vault or environment variables.
   * @param {Object} params
   * @param {string} params.envKey
   * @param {string} params.vaultTarget
   * @returns {string|undefined}
   */
  resolveSecret({ envKey, vaultTarget }) {
    return this.service.resolveSecret({ envKey, vaultTarget });
  }

  /**
   * Ensure a secret exists, prompting if configured.
   * @param {Object} params
   * @param {string} params.target
   * @param {string} [params.promptMessage]
   * @returns {Promise<string>}
   */
  async ensureSecret({ target, promptMessage }) {
    return this.service.ensureSecret({ target, promptMessage });
  }
}
