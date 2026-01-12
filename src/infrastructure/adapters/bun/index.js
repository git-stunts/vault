import KeychainAdapter from '../KeychainAdapter.js';
import BunCommandRunner from './CommandRunner.js';

const defaultPlatformGetter = () => {
  if (typeof process !== 'undefined' && process && typeof process.platform === 'string') {
    return process.platform;
  }
  return 'unknown';
};

export function createBunKeychainAdapter({ account = 'git-stunts', commandRunner, platformGetter } = {}) {
  return new KeychainAdapter({
    account,
    commandRunner: commandRunner ?? new BunCommandRunner(),
    platformGetter: platformGetter ?? defaultPlatformGetter
  });
}

export { BunCommandRunner };
