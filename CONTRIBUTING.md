# Contributing to @git-stunts/vault

## Development Philosophy

This project follows **Hexagonal Architecture**.

- **Domain Layer**: Pure business logic (resolution order, prompting).
- **Infrastructure**: OS-specific commands.

## Testing

We use **Vitest**.
- Run all tests: `npm test`
- Mocking: We mock the `KeychainAdapter` to test the service logic without needing access to the real OS keychain.

## Style Guide

- Use `ESLint` and `Prettier`.
- Commit messages should follow conventional commits.
