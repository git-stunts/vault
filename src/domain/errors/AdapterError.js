import VaultError from './VaultError.js';

export default class AdapterError extends VaultError {
  constructor(message, code, meta = {}) {
    super(message, code, meta);
  }

  static missingCommandRunner() {
    return new AdapterError('commandRunner is required', 'adapter.missing-command-runner');
  }

  static invalidAdapter() {
    return new AdapterError('adapter implementing get/set/delete is required', 'adapter.invalid');
  }
}
