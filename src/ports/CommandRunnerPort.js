import CommandRunnerPortError from '../domain/errors/CommandRunnerPortError.js';

/**
 * Interface for running synchronous commands on the host platform.
 * Implementations should return an object resembling Node's `spawnSync` result.
 */
export default class CommandRunnerPort {
  /**
   * @param {string} command
   * @param {string[]} args
   * @param {Object} options
   * @returns {{ status: number|null, stdout?: string, stderr?: string }}
   */
  run(command, args = [], options = {}) {
    throw CommandRunnerPortError.missingImplementation();
  }
}
