# Vault Usage Guide

This guide covers the essential patterns for using `@git-stunts/vault` to manage secrets across different platforms.

## 1. Asynchronous API

As of v2.0, all operations that interact with the OS keychain are asynchronous. This ensures your application remains responsive during keychain unlocking or slow dbus responses on Linux.

```javascript
import Vault from '@git-stunts/vault';

const vault = new Vault({ account: 'my-service' });

// MUST await all secret operations
const value = await vault.getSecret({ target: 'MAIN_KEY' });
```

## 2. Platform Adapters

Vault automatically detects your runtime and platform, but you can also provide custom adapters if needed.

- **macOS**: Uses the `/usr/bin/security` binary.
- **Linux**: Uses `dbus-send` to communicate with the Secret Service.
- **Windows**: Uses `cmdkey`.

### Runtime Detection

Vault supports **Node.js, Bun, and Deno** out of the box. It will automatically select the best subprocess runner for the current runtime.

## 3. Interactive Promotion (ensureSecret)

One of the most useful features of Vault is the ability to ensure a secret exists, prompting the user if it's missing.

```javascript
const password = await vault.ensureSecret({
  target: 'DB_PASSWORD',
  promptMessage: 'Please enter your database password: '
});

// If DB_PASSWORD was in the vault, it returns immediately.
// If missing and in a TTY, it prompts the user, saves the result to the vault, and returns it.
// If missing and NOT in a TTY, it throws a SecretMissingError.
```

## 4. Custom Accounts

The `account` option in the constructor determines the "label" or "service" name in the OS keychain. This prevents collisions between different applications.

```javascript
const appVault = new Vault({ account: 'my-app' });
const toolVault = new Vault({ account: 'my-tool' });

await appVault.setSecret({ target: 'KEY', value: '123' });
await toolVault.setSecret({ target: 'KEY', value: '456' }); // Different entries in the OS
```

## 5. Security Best Practices

- **Avoid Hardcoding Targets**: Use constants or environment-mapped targets.
- **Redact Metadata**: When logging errors, ensure that secret values are not leaked via metadata bags.
- **OS-Level Permissions**: Remember that Vault uses the current user's OS-level permissions. If the OS keychain is locked, the user may be prompted by the OS to unlock it.
