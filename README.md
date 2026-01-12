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

## Runtime-specific adapters

- **Node (default)**: `Vault` auto-detects Bun and Deno globals and falls back to the Node adapter when neither is present.
- **Bun**: Import `createBunKeychainAdapter` (or rely on the auto-detection) to execute commands with `Bun.spawnSync` when running under Bun.
- **Deno**: Import `createDenoKeychainAdapter` and run via `Deno.Command`. See `deno.json` and `Dockerfile.deno` for a working setup.

The `plumbing/` folder contains the reference Dockerfiles for each runtime (`Dockerfile.bun`, `Dockerfile.deno`, etc.), so you can see how the ports are wired together in an end-to-end image.

## Docker-based tests

- `npm test` runs `scripts/run-multi-runtime-tests.sh`, which in turn brings up the `node-test`, `bun-test`, and `deno-test` containers defined in `docker-compose.yml`.
- Each container uses the respective Dockerfile (`Dockerfile`, `Dockerfile.bun`, `Dockerfile.deno`) so you can reproduce the same setup locally or in CI.

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

## Docker images

- `Dockerfile` (Node) mirrors the repository root workflow and runs `npm test`.
- `Dockerfile.bun` copies both projects, installs with Bun, and runs `bun run vitest test/unit`.
- `Dockerfile.deno` relies on `deno task test` defined in `deno.json`, which proxies back to the npm test stack via the shared script.

## License

Apache-2.0
Copyright © 2026 [James Ross](https://github.com/flyingrobots)
