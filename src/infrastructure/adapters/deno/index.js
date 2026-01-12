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

export function createDenoKeychainAdapter({ account = 'git-stunts', commandRunner, platformGetter } = {}) {
  return new KeychainAdapter({
    account,
    commandRunner: commandRunner ?? new DenoCommandRunner(),
    platformGetter: platformGetter ?? defaultPlatformGetter
  });
}

export { DenoCommandRunner };
