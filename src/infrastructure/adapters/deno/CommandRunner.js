import { decodeValue, encodeString } from '../shared/codec.js';
import CommandRunnerError from '../../../domain/errors/CommandRunnerError.js';

const encodeInput = (input) => {
  if (typeof input === 'string') {
    return encodeString(input);
  }
  return input;
};

const getGlobalDeno = () => {
  if (typeof Deno !== 'undefined') {
    return Deno;
  }
  return undefined;
};

export default class DenoCommandRunner {
  constructor({ deno } = {}) {
    this.deno = deno ?? getGlobalDeno();
  }

  run(command, args = [], options = {}) {
    const deno = this.deno;
    if (typeof deno === 'undefined' || typeof deno.Command !== 'function') {
      throw CommandRunnerError.missingCommand();
    }

    const cmd = new deno.Command(command, {
      args,
      cwd: options.cwd,
      env: options.env,
      stdin: 'piped',
      stdout: 'piped',
      stderr: 'piped'
    });

    const result = cmd.outputSync({ input: encodeInput(options.input) });

    return {
      status: result.code,
      stdout: decodeValue(result.stdout),
      stderr: decodeValue(result.stderr)
    };
  }
}
