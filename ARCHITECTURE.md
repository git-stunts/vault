# Architecture: @git-stunts/vault

This project adheres to **Hexagonal Architecture** (Ports and Adapters) to ensure security, testability, and separation of concerns.

## 🧱 Core Concepts

### Domain Layer (`src/domain/`)
The core logic for managing secrets, independent of the underlying OS.

- **Services**: `VaultService` orchestrates secret retrieval, storage, and resolution strategies (env vars vs vault).
- **Errors**: Domain-specific errors (`VaultError`, `SecretNotFoundError`) to abstract low-level failures.

### Ports (`src/ports/`)
Interfaces for the domain to talk to hosting platforms without knowing the details.

- **CommandRunnerPort**: Synchronous command execution (used by `KeychainAdapter`).

### Infrastructure Layer (`src/infrastructure/`)
Adapters for external systems.

- **Adapters**: `KeychainAdapter` orchestrates platform-agnostic command flow while relying on injected ports.
- **Node adapter**: `NodeCommandRunner` plus `createNodeKeychainAdapter` wire up the Node runtime (child_process, default platform detection).
- **Bun adapter**: `BunCommandRunner`/`createBunKeychainAdapter` execute commands via `Bun.spawnSync` when Bun is detected.
- **Deno adapter**: `DenoCommandRunner`/`createDenoKeychainAdapter` rely on `Deno.Command` so the same domain logic can run inside Deno.

## 📂 Directory Structure

```
src/
├── domain/
│   ├── errors/         # VaultError, etc.
│   └── services/       # VaultService
└── infrastructure/
    ├── adapters/       # KeychainAdapter
    ├── adapters/node/  # NodeCommandRunner, factories
    ├── adapters/bun/   # BunCommandRunner, factories
    └── adapters/deno/  # DenoCommandRunner, factories
```

## 🔐 Security Principles

1.  **Zero-Secret Architecture**: Secrets are never stored in the codebase or config files.
2.  **Least Privilege**: The adapter only requests the specific keys it needs.
3.  **OS-Native**: We rely on the OS's encrypted storage (Keychain, etc.) rather than implementing our own encryption.
