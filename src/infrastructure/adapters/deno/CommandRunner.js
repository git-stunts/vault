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

export default class DenoCommandRunner {
  run(command, args = [], options = {}) {
    if (typeof Deno === 'undefined' || typeof Deno.Command !== 'function') {
      throw new Error('Deno.Command is required for DenoCommandRunner');
    }

    const cmd = new Deno.Command(command, {
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
