# @git-stunts/vault

<img width="420" src="https://github.com/user-attachments/assets/aa623669-6269-48e8-83ef-66ffe9a46793" align="right" />


A secure interface to OS-native keychains (macOS, Linux, Windows) for "Zero-Secret Architecture."

### Why Vault?

Storing API keys or encryption secrets in `.env` files is a security risk. `vault` offloads this responsibility to the operating system's native secure storage. Your application never "owns" the secret—it simply requests it when needed.

### Features

- **Cross-Platform**: Supports macOS Keychain, Linux Secret Service, and Windows Credential Manager.
- **Zero-Secret**: No plain-text keys on disk.
- **Interactive**: Can prompt the user for missing secrets and store them automatically.

## Requirements

- **macOS**: Works out of the box (uses `security`).
- **Linux**: Requires `libsecret` (e.g., `sudo apt install libsecret-tools`).
- **Windows**: Requires the `CredentialManager` PowerShell module.

## Usage

```javascript
import Vault from '@git-stunts/vault';

const vault = new Vault({ account: 'my-app' });

// Get a secret (returns undefined if missing)
const key = vault.getSecret({ target: 'CHUNK_ENC_KEY' });

// Ensure a secret exists (prompts user if missing)
const secret = await vault.ensureSecret({ 
  target: 'API_TOKEN', 
  promptMessage: 'Enter your API Token' 
});

// Resolve with Env Var priority
const apiKey = vault.resolveSecret({ 
  envKey: 'MY_API_KEY', 
  vaultTarget: 'api-key' 
});
```

## License

Apache-2.0
Copyright © 2026 [James Ross](https://github.com/flyingrobots)

