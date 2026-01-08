import VaultError from './VaultError.js';

export default class SecretNotFoundError extends VaultError {
  constructor(target) {
    super(`Secret '${target}' not found.`, 'SECRET_NOT_FOUND', { target });
  }
}
