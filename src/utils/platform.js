export function getPlatform() {
  if (typeof Deno !== 'undefined' && typeof Deno.build?.os === 'string') {
    switch (Deno.build.os) {
      case 'windows':
        return 'win32';
      case 'darwin':
        return 'darwin';
      case 'linux':
        return 'linux';
      default:
        return Deno.build.os;
    }
  }
  if (typeof process !== 'undefined' && process && typeof process.platform === 'string') {
    return process.platform;
  }
  return 'unknown';
}
