import { getPlatform } from '../utils/platform.js';

const isDenoRuntime = typeof Deno !== 'undefined' && typeof Deno.version?.deno === 'string';

const getPromptLabel = (promptMessage) => (promptMessage && typeof promptMessage === 'string' ? promptMessage : 'Secret');

const nodePromptSecret = async (promptMessage) => {
  if (typeof process === 'undefined' || !process.stdin || !process.stderr) {
    throw new Error('Node stdin is required for prompting secrets');
  }
  const { createInterface } = await import('node:readline');
  return new Promise((resolve) => {
    const label = getPromptLabel(promptMessage);
    const rl = createInterface({
      input: process.stdin,
      output: process.stderr,
      terminal: true,
    });
    rl.stdoutMuted = true;
    rl._writeToOutput = function (stringToWrite) {
      this.output.write(this.stdoutMuted ? '*' : stringToWrite);
    };
    rl.question(`${label}: `, (answer) => {
      rl.stdoutMuted = false;
      rl.close();
      process.stderr.write('\n');
      resolve(answer);
    });
  });
};

const denoPromptSecret = async (promptMessage) => {
  if (typeof prompt !== 'function') {
    throw new Error('Deno prompt API is not available for secret entry');
  }
  const label = getPromptLabel(promptMessage);
  const answer = prompt(`${label}: `);
  if (answer === null) {
    throw new Error('Secret prompt was cancelled by the user');
  }
  return answer;
};

const defaultEnvGetter = (key) => {
  if (isDenoRuntime && typeof Deno.env?.get === 'function') {
    return Deno.env.get(key);
  }
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  return undefined;
};

const defaultIsTTY = () => {
  if (isDenoRuntime && typeof Deno.isatty === 'function' && typeof Deno.stdin?.rid === 'number') {
    try {
      return Deno.isatty(Deno.stdin.rid);
    } catch {
      return false;
    }
  }
  if (typeof process !== 'undefined' && process.stdin) {
    return Boolean(process.stdin.isTTY);
  }
  return false;
};

const defaultPromptSecret = isDenoRuntime ? denoPromptSecret : nodePromptSecret;

export const defaultRuntime = {
  getEnv: defaultEnvGetter,
  isTTY: defaultIsTTY,
  promptSecret: defaultPromptSecret,
  getPlatform,
};
