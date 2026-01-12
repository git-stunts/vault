import { spawnSync } from 'node:child_process';

/**
 * Node-specific implementation of the command runner port.
 */
export default class NodeCommandRunner {
  run(command, args = [], options = {}) {
    const result = spawnSync(command, args, { encoding: 'utf8', ...options });
    return {
      status: typeof result.status === 'number' ? result.status : null,
      stdout: typeof result.stdout === 'string' ? result.stdout : undefined,
      stderr: typeof result.stderr === 'string' ? result.stderr : undefined,
    };
  }
}
