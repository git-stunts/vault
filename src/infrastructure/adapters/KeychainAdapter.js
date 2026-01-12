import { spawnSync } from 'node:child_process';
import PlatformNotSupportedError from '../../domain/errors/PlatformNotSupportedError.js';

/**
 * Adapter for interacting with OS-native keychains.
 */
export default class KeychainAdapter {
  constructor(account, runner) {
    this.account = account;
    this.runner = runner || this._defaultRunner.bind(this);
  }

  get platform() {
    return process.platform;
  }

  _defaultRunner(command, args, options = {}) {
    const result = spawnSync(command, args, { encoding: 'utf8', ...options });
    if (result.status !== 0) {
      return undefined;
    }
    return typeof result.stdout === 'string' ? result.stdout.trim() : undefined;
  }

  _run(command, args, options = {}) {
    return this.runner(command, args, options);
  }

  get(target) {
    if (this.platform === 'darwin') {
      return this._run('security', ['find-generic-password', '-a', this.account, '-s', target, '-w'], {
        stdio: ['ignore', 'pipe', 'ignore'],
      });
    }

    if (this.platform === 'linux') {
      return this._run('secret-tool', ['lookup', 'service', target]);
    }

    if (this.platform === 'win32') {
      const psLiteral = (val) => `'${val.replace(/'/g, "''")}'`;
      const script = `try {
        if (Get-Module -ListAvailable -Name CredentialManager) {
          Import-Module CredentialManager -ErrorAction Stop
          $c = Get-StoredCredential -Target ${psLiteral(target)} 
          if ($c -and $c.Password) { Write-Output $c.Password }
        }
      } catch { }`;
      return this._run('powershell', ['-NoProfile', '-Command', script]);
    }

    throw new PlatformNotSupportedError(this.platform);
  }

  set(target, value) {
    if (this.platform === 'darwin') {
      spawnSync('security', ['delete-generic-password', '-a', this.account, '-s', target], { stdio: 'ignore' });
      const res = spawnSync('security', ['add-generic-password', '-a', this.account, '-s', target, '-w', value, '-U'], {
        stdio: 'ignore',
      });
      return res.status === 0;
    }

    if (this.platform === 'linux') {
      const res = spawnSync('secret-tool', ['store', '--label', target, 'service', target], {
        input: value,
        encoding: 'utf8',
        stdio: ['pipe', 'ignore', 'inherit'],
      });
      return res.status === 0;
    }

    if (this.platform === 'win32') {
      const psLiteral = (val) => `'${val.replace(/'/g, "''")}'`;
      const script = `try {
        if (!(Get-Module -ListAvailable -Name CredentialManager)) {
          Install-Module -Name CredentialManager -Scope CurrentUser -Force -ErrorAction Stop
        }
        Import-Module CredentialManager -ErrorAction Stop
        $pwd = ${psLiteral(value)}
        New-StoredCredential -Target ${psLiteral(target)} -UserName ${psLiteral(this.account)} -Password $pwd -Persist CurrentUser | Out-Null
      } catch { exit 1 }`;
      const res = spawnSync('powershell', ['-NoProfile', '-Command', script]);
      return res.status === 0;
    }

    throw new PlatformNotSupportedError(this.platform);
  }

  delete(target) {
    if (this.platform === 'darwin') {
      const res = spawnSync('security', ['delete-generic-password', '-a', this.account, '-s', target], { stdio: 'ignore' });
      return res.status === 0;
    }

    if (this.platform === 'linux') {
      const res = spawnSync('secret-tool', ['clear', 'service', target], { stdio: 'ignore' });
      return res.status === 0;
    }

    if (this.platform === 'win32') {
      const psLiteral = (val) => `'${val.replace(/'/g, "''")}'`;
      const script = `try {
        if (Get-Module -ListAvailable -Name CredentialManager) {
          Import-Module CredentialManager -ErrorAction Stop
          Remove-StoredCredential -Target ${psLiteral(target)} -ErrorAction SilentlyContinue | Out-Null
        }
      } catch { exit 1 }`;
      const res = spawnSync('powershell', ['-NoProfile', '-Command', script]);
      return res.status === 0;
    }

    throw new PlatformNotSupportedError(this.platform);
  }
}
