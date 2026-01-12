import KeychainAdapter from '../KeychainAdapter.js';
import DenoCommandRunner from './CommandRunner.js';

const PLATFORM_MAP = {
  darwin: 'darwin',
  linux: 'linux',
  windows: 'win32'
};

const defaultPlatformGetter = () => {
  if (typeof Deno !== 'undefined' && Deno.build && typeof Deno.build.os === 'string') {
    return PLATFORM_MAP[Deno.build.os] ?? 'unknown';
  }
  return 'unknown';
};

/**
 * Build a Deno-compatible keychain adapter.
 * @param {Object} options
 * @param {string} [options.account]
 * @param {CommandRunner} [options.commandRunner]
 * @param {Function} [options.platformGetter]
 * @returns {KeychainAdapter}
 */
export function createDenoKeychainAdapter({ account = 'git-stunts', commandRunner, platformGetter } = {}) {
  return new KeychainAdapter({
    account,
    commandRunner: commandRunner ?? new DenoCommandRunner(),
    platformGetter: platformGetter ?? defaultPlatformGetter
  });
}

export { DenoCommandRunner };
