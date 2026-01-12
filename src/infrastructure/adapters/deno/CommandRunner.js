const ENCODER = new TextEncoder();
const DECODER = new TextDecoder();

const encodeInput = (input) => {
  if (typeof input === 'string') {
    return ENCODER.encode(input);
  }
  return input;
};

const decode = (value) => {
  if (typeof value === 'string') {
    return value;
  }
  if (value instanceof Uint8Array) {
    return DECODER.decode(value);
  }
  if (value instanceof ArrayBuffer) {
    return DECODER.decode(new Uint8Array(value));
  }
  return undefined;
};

const getGlobalDeno = () => {
  if (typeof Deno !== 'undefined') {
    return Deno;
  }
  return undefined;
};

export default class DenoCommandRunner {
  constructor({ deno } = {}) {
    this.deno = deno;
  }

  run(command, args = [], options = {}) {
    const deno = this.deno ?? getGlobalDeno();
    if (typeof deno === 'undefined' || typeof deno.Command !== 'function') {
      throw new Error('Deno.Command is required for DenoCommandRunner');
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
      stdout: decode(result.stdout),
      stderr: decode(result.stderr)
    };
  }
}
