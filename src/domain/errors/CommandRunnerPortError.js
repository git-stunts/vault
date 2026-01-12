import VaultError from './VaultError.js';

export default class CommandRunnerPortError extends VaultError {
  constructor(message, code, meta = {}) {
    super(message, code, meta);
  }

  static missingImplementation() {
    return new CommandRunnerPortError(
      'CommandRunnerPort.run() must be implemented',
      'command-runner-port.missing-implementation'
    );
  }
}
