import KeychainAdapter from '../KeychainAdapter.js';
import BunCommandRunner from './CommandRunner.js';
import { getPlatform } from '../../../utils/platform.js';

const defaultPlatformGetter = getPlatform;

/**
 * Build a Bun-compatible keychain adapter.
 * @param {Object} options
 * @param {string} [options.account]
 * @param {CommandRunner} [options.commandRunner]
 * @param {Function} [options.platformGetter]
 * @returns {KeychainAdapter}
 */
export function createBunKeychainAdapter({ account = 'git-stunts', commandRunner, platformGetter } = {}) {
  return new KeychainAdapter({
    account,
    commandRunner: commandRunner ?? new BunCommandRunner(),
    platformGetter: platformGetter ?? defaultPlatformGetter
  });
}

export { BunCommandRunner };
