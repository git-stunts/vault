# COOL IDEA™: Remote Vault Provider

## Context
`vault` is currently locked to the local OS keychain.

## Description
Implement a `HttpVaultAdapter` that can fetch/store secrets from a secure remote API (e.g., HashiCorp Vault, AWS Secrets Manager, or a custom @git-stunts-relay).

## Value
- Distributed secret management across teams/environments.
- Consistent API for both local and cloud-based secrets.
