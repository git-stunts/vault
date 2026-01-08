import VaultError from './VaultError.js';

export default class PlatformNotSupportedError extends VaultError {
  constructor(platform) {
    super(`Platform '${platform}' is not supported.`, 'PLATFORM_NOT_SUPPORTED', { platform });
  }
}
