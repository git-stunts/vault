import KeychainAdapter from '../KeychainAdapter.js';
import NodeCommandRunner from './CommandRunner.js';
import { getPlatform } from '../../utils/platform.js';

const defaultPlatformGetter = getPlatform;

export function createNodeKeychainAdapter({ account = 'git-stunts', commandRunner, platformGetter } = {}) {
  return new KeychainAdapter({
    account,
    commandRunner: commandRunner ?? new NodeCommandRunner(),
    platformGetter: platformGetter ?? defaultPlatformGetter,
  });
}

export { NodeCommandRunner };
