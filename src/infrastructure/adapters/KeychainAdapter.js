import PlatformNotSupportedError from '../../domain/errors/PlatformNotSupportedError.js';
import { getPlatform } from '../../utils/platform.js';

const defaultPlatformGetter = getPlatform;

export default class KeychainAdapter {
  constructor({ account = 'git-stunts', commandRunner, platformGetter } = {}) {
    if (!commandRunner || typeof commandRunner.run !== 'function') {
      throw new Error('commandRunner is required');
    }

    this.account = account;
    this.commandRunner = commandRunner;
    this.platformGetter = platformGetter || defaultPlatformGetter;
  }

  get platform() {
    return this.platformGetter();
  }

  _run(command, args = [], options = {}) {
    const optionKeys = options ? Object.keys(options) : [];
    const result =
      optionKeys.length > 0
        ? this.commandRunner.run(command, args, options)
        : this.commandRunner.run(command, args);
    if (!result || result.status !== 0) {
      return undefined;
    }
    const stdout = result.stdout;
    return typeof stdout === 'string' ? stdout.trim() : undefined;
  }

  get(target) {
    const platform = this.platform;

    if (platform === 'darwin') {
      return this._run('security', ['find-generic-password', '-a', this.account, '-s', target, '-w'], {
        stdio: ['ignore', 'pipe', 'ignore'],
      });
    }

    if (platform === 'linux') {
      return this._run('secret-tool', ['lookup', 'service', target]);
    }

    if (platform === 'win32') {
      const psLiteral = (val) => `'${val.replace(/'/g, "''")}'`;
      const script = `try {
        if (Get-Module -ListAvailable -Name CredentialManager) {
          Import-Module CredentialManager -ErrorAction Stop
          $c = Get-StoredCredential -Target ${psLiteral(target)} 
          if ($c -and $c.Password) { Write-Output $c.Password }
        }
      } catch { exit 1 }`;
      return this._run('powershell', ['-NoProfile', '-Command', script]);
    }

    throw new PlatformNotSupportedError(platform);
  }

  set(target, value) {
    const platform = this.platform;

    if (platform === 'darwin') {
      this.commandRunner.run('security', ['delete-generic-password', '-a', this.account, '-s', target], {
        stdio: 'ignore',
      });
      const res = this.commandRunner.run('security', ['add-generic-password', '-a', this.account, '-s', target, '-w', value, '-U'], {
        stdio: 'ignore',
      });
      return res && res.status === 0;
    }

    if (platform === 'linux') {
      const res = this.commandRunner.run('secret-tool', ['store', '--label', target, 'service', target], {
        input: value,
        encoding: 'utf8',
        stdio: ['pipe', 'ignore', 'inherit'],
      });
      return res && res.status === 0;
    }

    if (platform === 'win32') {
      const psLiteral = (val) => `'${val.replace(/'/g, "''")}'`;
      const script = `try {
        if (!(Get-Module -ListAvailable -Name CredentialManager)) { exit 1 }
        Import-Module CredentialManager -ErrorAction Stop
        $pwd = ${psLiteral(value)}
        New-StoredCredential -Target ${psLiteral(target)} -UserName ${psLiteral(this.account)} -Password $pwd -Persist CurrentUser | Out-Null
      } catch { exit 1 }`;
      const res = this.commandRunner.run('powershell', ['-NoProfile', '-Command', script]);
      return res && res.status === 0;
    }

    throw new PlatformNotSupportedError(platform);
  }

  delete(target) {
    const platform = this.platform;

    if (platform === 'darwin') {
      const res = this.commandRunner.run('security', ['delete-generic-password', '-a', this.account, '-s', target], {
        stdio: 'ignore',
      });
      return res && res.status === 0;
    }

    if (platform === 'linux') {
      const res = this.commandRunner.run('secret-tool', ['clear', 'service', target], { stdio: 'ignore' });
      return res && res.status === 0;
    }

    if (platform === 'win32') {
      const psLiteral = (val) => `'${val.replace(/'/g, "''")}'`;
      const script = `try {
        if (Get-Module -ListAvailable -Name CredentialManager) {
          Import-Module CredentialManager -ErrorAction Stop
          Remove-StoredCredential -Target ${psLiteral(target)} -ErrorAction SilentlyContinue | Out-Null
        }
      } catch { exit 1 }`;
      const res = this.commandRunner.run('powershell', ['-NoProfile', '-Command', script]);
      return res && res.status === 0;
    }

    throw new PlatformNotSupportedError(platform);
  }
}
