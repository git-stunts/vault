import readline from 'node:readline';
import VaultServiceError from '../errors/VaultServiceError.js';

/**
 * Domain service for managing secrets.
 */
export default class VaultService {
  /**
   * @param {Object} options
   * @param {string} [options.account='git-stunts']
   * @param {Object} options.adapter - Adapter that fulfills the keychain port (get/set/delete).
   */
  constructor({ account = 'git-stunts', adapter } = {}) {
    this.account = account;

    if (!adapter || typeof adapter.get !== 'function' || typeof adapter.set !== 'function' || typeof adapter.delete !== 'function') {
      throw VaultServiceError.missingAdapter();
    }

    this.adapter = adapter;
  }

  /**
   * Retrieves a secret.
   * @param {string} target
   * @returns {string|undefined}
   */
  getSecret(target) {
    if (!target) {
      throw VaultServiceError.missingTarget();
    }
    return this.adapter.get(target);
  }

  /**
   * Stores a secret.
   * @param {string} target
   * @param {string} value
   */
  setSecret(target, value) {
    if (!target) {
      throw VaultServiceError.missingTarget();
    }
    if (!value) {
      throw VaultServiceError.missingValue();
    }
    
    const success = this.adapter.set(target, value);
    if (!success) {
      throw VaultServiceError.storeFailed(target);
    }
  }

  /**
   * Deletes a secret.
   * @param {string} target
   * @returns {boolean}
   */
  deleteSecret(target) {
    if (!target) {
      throw VaultServiceError.missingTarget();
    }
    return this.adapter.delete(target);
  }

  /**
   * Resolves a secret by checking environment variables first, then the vault.
   * @param {Object} params
   * @param {string} params.envKey
   * @param {string} params.vaultTarget
   * @returns {string|null}
   */
  resolveSecret({ envKey, vaultTarget }) {
    if (process.env[envKey]) {
      return process.env[envKey];
    }
    try {
      return this.getSecret(vaultTarget) || null;
    } catch {
      return null;
    }
  }

  /**
   * Prompts the user for a secret if it's missing from the vault.
   * @param {Object} params
   * @param {string} params.target
   * @param {string} params.promptMessage
   * @returns {Promise<string>}
   */
  async ensureSecret({ target, promptMessage }) {
    const value = this.getSecret(target);
    if (value) {
      return value;
    }

    if (!process.stdin.isTTY) {
      throw VaultServiceError.secretMissing(target);
    }

    return new Promise((resolve, reject) => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stderr,
        terminal: true,
      });
      rl.stdoutMuted = true;
      rl._writeToOutput = (stringToWrite) => {
        rl.output.write(rl.stdoutMuted ? '*' : stringToWrite);
      };

      rl.question(`${promptMessage}: `, (answer) => {
        rl.stdoutMuted = false;
        rl.close();
        process.stderr.write('\n');

        const trimmed = answer.trim();
        if (!trimmed) {
          reject(VaultServiceError.emptySecret());
          return;
        }

        try {
          this.setSecret(target, trimmed);
          resolve(trimmed);
        } catch (err) {
          reject(err);
        }
      });
    });
  }
}
