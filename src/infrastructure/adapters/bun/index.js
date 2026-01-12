import KeychainAdapter from '../KeychainAdapter.js';
import BunCommandRunner from './CommandRunner.js';
import { getPlatform } from '../../utils/platform.js';

const defaultPlatformGetter = getPlatform;

export function createBunKeychainAdapter({ account = 'git-stunts', commandRunner, platformGetter } = {}) {
  return new KeychainAdapter({
    account,
    commandRunner: commandRunner ?? new BunCommandRunner(),
    platformGetter: platformGetter ?? defaultPlatformGetter
  });
}

export { BunCommandRunner };
