# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-05-06

### Added
- **Async-First Core**: Refactored `VaultService` and the `Vault` facade to be entirely asynchronous, ensuring non-blocking interaction with OS keychains.
- **Modernized Documentation**: Rewrote `README.md` and added `GUIDE.md` to reflect modern async patterns and improve onboarding.

### Changed
- **Breaking: Async API**: `getSecret`, `setSecret`, `deleteSecret`, and `resolveSecret` now return `Promise` instances and must be `await`ed.

## [1.0.0] - 2025-11-20

### Added
- Initial industrial-grade release.
- Multi-runtime support for Node.js, Bun, and Deno.
- OS-native adapters for macOS, Linux, and Windows.
- TTY promotion support via `ensureSecret`.
