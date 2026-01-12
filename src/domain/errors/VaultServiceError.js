import VaultError from './VaultError.js';

export default class VaultServiceError extends VaultError {
  constructor(message, code, meta = {}) {
    super(message, code, meta);
  }

  static missingAdapter() {
    return new VaultServiceError('adapter implementing get/set/delete is required', 'vault-service.missing-adapter');
  }

  static missingTarget() {
    return new VaultServiceError('target is required', 'vault-service.missing-target');
  }

  static missingValue() {
    return new VaultServiceError('value is required', 'vault-service.missing-value');
  }

  static storeFailed(target) {
    return new VaultServiceError(`Failed to store secret for ${target}`, 'vault-service.store-failed', { target });
  }

  static secretMissing(target) {
    return new VaultServiceError(
      `Secret ${target} missing and no TTY for prompt`,
      'vault-service.secret-missing',
      { target }
    );
  }

  static emptySecret() {
    return new VaultServiceError('Secret cannot be empty', 'vault-service.empty-secret');
  }
}
