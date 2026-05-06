# @git-stunts/vault

[![npm version](https://img.shields.io/npm/v/@git-stunts/vault.svg)](https://www.npmjs.com/package/@git-stunts/vault)
[![License](https://img.shields.io/npm/l/@git-stunts/vault.svg)](LICENSE)

> **Industrial-Grade Interface to OS-Native Keychains.**

`@git-stunts/vault` provides a secure, environment-agnostic abstraction for interacting with OS-level secret storage (macOS Keychain, Linux Secret Service, Windows Credential Manager). Designed for high-stakes CLI tools and industrial workflows.

## 📦 Key Features

- **Async-First API**: Modernized for v2.0, every secret operation is asynchronous and non-blocking.
- **Multi-Runtime Support**: Native adapters for Node.js, Bun, and Deno with automatic environment detection.
- **Hexagonal Architecture**: Strict separation between secret management logic and platform-specific implementations.
- **Interactive Promotion**: Built-in support for TTY prompting if a secret is missing from the vault.
- **Security by Default**: Uses native platform binaries (security, dbus-send, cmdkey) to avoid heavy native dependencies.

## 🚀 Quick Start

### Basic Secret Management

```javascript
import Vault from '@git-stunts/vault';

const vault = new Vault({ account: 'my-app' });

// Store a secret (Async)
await vault.setSecret({ target: 'API_KEY', value: 'sk_live_123' });

// Retrieve a secret (Async)
const key = await vault.getSecret({ target: 'API_KEY' });
```

### Smart Resolution

Resolve a secret by checking environment variables first, falling back to the OS vault.

```javascript
const secret = await vault.resolveSecret({
  envKey: 'MY_APP_SECRET',
  vaultTarget: 'MASTER_KEY'
});
```

## 🛡️ Requirements

- **Node.js**: >= 20.0.0
- **Bun**: >= 1.3.5
- **Deno**: >= 2.0.0
- **System**: macOS, Linux (with `libsecret` / `dbus`), or Windows.

## 📖 Documentation

- [**Standard Guide**](./GUIDE.md) - Configuration, adapters, and TTY prompting.
- [**Architecture**](./ARCHITECTURE.md) - Deep dive into the port/adapter model.
- [**Contributing**](./CONTRIBUTING.md) - Guidelines for adding new platform adapters.

## 🧪 Testing

This project requires OS-level interaction. Tests should be run in isolated environments where possible.

```bash
npm test
```

## 📄 License

Apache-2.0
