export function getPlatform() {
  if (typeof process !== 'undefined' && process && typeof process.platform === 'string') {
    return process.platform;
  }
  return 'unknown';
}
