# Architecture: @git-stunts/vault

This project adheres to **Hexagonal Architecture** (Ports and Adapters) to ensure security, testability, and separation of concerns.

## 🧱 Core Concepts

### Domain Layer (`src/domain/`)
The core logic for managing secrets, independent of the underlying OS.

- **Services**: `VaultService` orchestrates secret retrieval, storage, and resolution strategies (env vars vs vault).
- **Errors**: Domain-specific errors (`VaultError`, `SecretNotFoundError`) to abstract low-level failures.

### Infrastructure Layer (`src/infrastructure/`)
Adapters for external systems.

- **Adapters**: `KeychainAdapter` handles the specific OS commands (`security`, `secret-tool`, `PowerShell`) to interact with the native keychain.

## 📂 Directory Structure

```
src/
├── domain/
│   ├── errors/         # VaultError, etc.
│   └── services/       # VaultService
└── infrastructure/
    └── adapters/       # KeychainAdapter
```

## 🔐 Security Principles

1.  **Zero-Secret Architecture**: Secrets are never stored in the codebase or config files.
2.  **Least Privilege**: The adapter only requests the specific keys it needs.
3.  **OS-Native**: We rely on the OS's encrypted storage (Keychain, etc.) rather than implementing our own encryption.
