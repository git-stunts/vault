import { getPlatform } from '../utils/platform.js';

const isDenoRuntime = typeof Deno !== 'undefined' && typeof Deno.version?.deno === 'string';

const getPromptLabel = (promptMessage) => (promptMessage && typeof promptMessage === 'string' ? promptMessage : 'Secret');

const nodePromptSecret = async (promptMessage) => {
  if (typeof process === 'undefined' || !process.stdin || !process.stderr) {
    throw new Error('Node stdin is required for prompting secrets');
  }
  const { createInterface } = await import('node:readline');
  return new Promise((resolve, reject) => {
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
    rl.on('close', () => {
      reject(new Error('Secret prompt was cancelled'));
    });
    rl.question(`${label}: `, (answer) => {
      rl.stdoutMuted = false;
      rl.removeAllListeners('close');
      rl.close();
      process.stderr.write('\n');
      resolve(answer);
    });
  });
};

const denoPromptSecret = async (promptMessage) => {
  const { promptSecret } = await import('@std/cli/prompt/mod.ts');
  const label = getPromptLabel(promptMessage);
  const answer = await promptSecret({ message: `${label}: `, type: 'password' });
  if (answer === null || typeof answer === 'undefined') {
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
  if (isDenoRuntime && typeof Deno.stdin?.isTerminal === 'function') {
    try {
      return Deno.stdin.isTerminal();
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
