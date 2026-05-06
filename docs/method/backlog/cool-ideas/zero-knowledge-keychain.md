# COOL IDEA™: Zero-Knowledge Keychain

## Context
`vault` currently relies on the OS-native keychain's encryption.

## Description
Implement a `MasterKeyAdapter` that encrypts secret values with a user-provided master passphrase *before* storing them in the OS keychain.

## Value
- Double-encryption (Vault Key + OS Key).
- Protects secrets even if the OS keychain is compromised but the master passphrase remains safe.
