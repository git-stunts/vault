import VaultError from './VaultError.js';

export default class CommandRunnerError extends VaultError {
  constructor(message, code, meta = {}) {
    super(message, code, meta);
  }

  static missingCommand() {
    return new CommandRunnerError(
      'Deno.Command is required for DenoCommandRunner',
      'command-runner.missing-command'
    );
  }

  static missingSpawnSync(runtime) {
    return new CommandRunnerError(
      `${runtime}.spawnSync is required for ${runtime}CommandRunner`,
      'command-runner.missing-spawn-sync',
      { runtime }
    );
  }
}
