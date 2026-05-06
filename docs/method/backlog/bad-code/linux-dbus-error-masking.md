# BAD CODE: Linux D-Bus Adapter Error Masking

## Context
The `DenoKeychainAdapter` and `BunKeychainAdapter` for Linux use `dbus-send` or `busctl` and swallow most stderr output.

## Symptoms
When secret retrieval fails due to a locked keyring or missing service, the library often returns a generic `VaultError` or `undefined`, making it impossible to diagnose underlying DBus issues.

## Proposed Fix
Implement a specialized `LinuxErrorClassifier` that parses DBus stderr and surfaces specific platform errors (e.g., `KEYRING_LOCKED`, `SERVICE_NOT_FOUND`).
