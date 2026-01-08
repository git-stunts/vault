# Codebase Audit: @git-stunts/vault

**Auditor:** Senior Principal Software Auditor
**Date:** January 7, 2026
**Target:** `@git-stunts/vault`

---

## 1. QUALITY & MAINTAINABILITY ASSESSMENT (EXHAUSTIVE)

### 1.1. Technical Debt Score (1/10)
**Justification:**
1.  **Dependency Injection**: `KeychainAdapter` accepts a `runner`, making it fully testable without OS mocks.
2.  **Clean Abstractions**: The domain service logic is pure and distinct from the OS commands.
3.  **Minimal Dependencies**: Only `node:child_process` and `node:readline` (standard lib).

### 1.2. Readability & Consistency

*   **Issue 1:** **Implicit Platform Detection**
    *   `KeychainAdapter` checks `process.platform` internally. It would be cleaner to have distinct adapter subclasses (`MacKeychainAdapter`, `LinuxSecretToolAdapter`, etc.) selected by a factory, rather than one adapter with `if/else` blocks.
*   **Mitigation Prompt 1:**
    ```text
    (Refactoring) Create `src/infrastructure/adapters/strategies/MacStrategy.js`, `LinuxStrategy.js`, etc., implementing a common interface. Update `KeychainAdapter` to delegate to the correct strategy based on `process.platform`.
    ```

*   **Issue 2:** **Silent Failures in PowerShell**
    *   The Windows PowerShell script uses `try { ... } catch { }` which might suppress legitimate errors (like permissions issues) and return undefined, looking like a "not found" result.
*   **Mitigation Prompt 2:**
    ```text
    In `src/infrastructure/adapters/KeychainAdapter.js`, modify the PowerShell script to output specific error codes or messages to stderr in the `catch` block, so the adapter can distinguish between "key not found" and "credential manager failure".
    ```

*   **Issue 3:** **Interactive Prompt Blocking**
    *   `VaultService.ensureSecret` uses `readline` which blocks the event loop's IO phase for user input. This is standard for CLIs but could be problematic if used in a server startup script without `await`.
*   **Mitigation Prompt 3:**
    ```text
    Add JSDoc to `ensureSecret` in `src/domain/services/VaultService.js` explicitly stating: "WARNING: This method requires TTY and blocks execution until user input is received. Do not use in non-interactive environments."
    ```

### 1.3. Code Quality Violation

*   **Violation 1:** **Hardcoded Command Strings**
    *   Commands like `security find-generic-password` are hardcoded in the adapter methods.
*   **Mitigation Prompt 4:**
    ```text
    Extract the command templates into a `commands.js` constant file or a configuration object to separate data from logic.
    ```

---

## 2. PRODUCTION READINESS & RISK ASSESSMENT (EXHAUSTIVE)

### 2.1. Top 3 Immediate Ship-Stopping Risks

*   **Risk 1:** **Credential Leak via Shell Arguments**
    *   **Severity:** **Critical**
    *   **Location:** `src/infrastructure/adapters/KeychainAdapter.js`
    *   **Description:** `spawnSync` is called with the secret value in the arguments array (e.g., `-w`, value). **This exposes the secret to the process table (`ps aux`) on some systems.**
*   **Mitigation Prompt 7:**
    ```text
    In `src/infrastructure/adapters/KeychainAdapter.js`, refactor the `set` method.
    For macOS (`security`): Use `spawn` with `{ stdio: ['pipe', ...] }` and write the password to `stdin` using the `-w` (read from stdin) option if available, or verify if `security` supports it. *Correction*: `security add-generic-password` takes `-w <password>`. This IS insecure.
    **Fix:** Use `security` interactive mode or find a safe way.
    For Linux (`secret-tool`): The code already uses `{ input: value }` (stdin), which is secure.
    For Windows: The PowerShell script constructs a string `$pwd = '...'`. This is passed as a command argument. **INSECURE**.
    **Action:** Refactor to pass secrets via Stdin universally where possible.
    ```

*   **Risk 2:** **Platform Incompatibility (Windows/Linux)**
    *   **Severity:** **High**
    *   **Description:** The code assumes `secret-tool` (libsecret) and `CredentialManager` module are installed. If missing, it throws/fails.
*   **Mitigation Prompt 8:**
    ```text
    In `src/domain/services/VaultService.js` (or a new startup check), add a `verifyPrerequisites()` method that checks for the existence of `secret-tool` (Linux) or `Get-Module CredentialManager` (Windows) and throws a clear `dependency missing` error with installation instructions.
    ```

*   **Risk 3:** **Blocking Sync Calls**
    *   **Severity:** **Medium**
    *   **Description:** `spawnSync` blocks the entire Node.js event loop. While acceptable for a CLI tool, if this library is imported into an Electron app or a server, it will cause UI freezes/lag.
*   **Mitigation Prompt 9:**
    ```text
    Refactor `KeychainAdapter` to use `spawn` (async) instead of `spawnSync` and return Promises. Update `VaultService` to be fully async.
    ```

### 2.2. Security Posture

*   **Vulnerability 1:** **Process Table Exposure (Reiteration)**
    *   As mentioned in Risk 1, passing secrets as arguments is a classic vulnerability.

*   **Vulnerability 2:** **Unsanitized Account Name**
    *   **Description:** The `account` option is used in shell commands. If a user provides `account: "foo; rm -rf /"`, it *might* inject commands depending on how `spawn` handles the arguments array (usually safe) vs the PowerShell script string interpolation (UNSAFE).
    *   **Location:** `KeychainAdapter.js`, Windows block: `-UserName '${this.account}'`. **This is an injection vector.**
*   **Mitigation Prompt 11:**
    ```text
    In `src/infrastructure/adapters/KeychainAdapter.js`, fix the PowerShell script construction. Escape `this.account` using the same `psLiteral` helper used for the target/value to prevent command injection.
    ```

### 2.3. Operational Gaps

*   **Gap 1:** **Diagnostics**: No way to verify if the vault is accessible without trying to read/write.

---

## 3. FINAL RECOMMENDATIONS & NEXT STEP

### 3.1. Final Ship Recommendation: **NO**
**DO NOT SHIP.** The **Process Table Exposure (Risk 1)** and **PowerShell Injection (Vuln 2)** are critical security flaws in a security library.

### 3.2. Prioritized Action Plan

1.  **Action 1 (Critical):** **Mitigation Prompt 11** (Fix PowerShell Injection).
2.  **Action 2 (Critical):** **Mitigation Prompt 7** (Fix Process Table Leak). Refactor `security` call to use stdin if possible, or research alternative safe invocation.
3.  **Action 3 (High):** **Mitigation Prompt 9** (Async/Non-blocking).

---

## PART II: Two-Phase Assessment

## 0. 🏆 EXECUTIVE REPORT CARD

| Metric | Score (1-10) | Recommendation |
|---|---|---|
| **Developer Experience (DX)** | 9 | **Best of:** The interactive `ensureSecret` flow is a massive TTV booster for CLI tools. |
| **Internal Quality (IQ)** | 4 | **Watch Out For:** Critical security vulnerabilities (Injection & Exposure) in the adapter implementation. |
| **Overall Recommendation** | **THUMBS DOWN** | **Justification:** A security library with injection vulnerabilities is worse than no library at all. |

## 5. STRATEGIC SYNTHESIS & ACTION PLAN

- **5.1. Combined Health Score:** **5/10**
- **5.2. Strategic Fix:** **Secure the Adapter**. Eliminate command injection and process table leaks.
- **5.3. Mitigation Prompt:**
    ```text
    Secure `src/infrastructure/adapters/KeychainAdapter.js`:
    1. Update the Windows/PowerShell logic to strictly escape `this.account` using `psLiteral`.
    2. Investigate and implement Stdin-based secret passing for macOS `security` (or use `security add-generic-password -w` which reads from stdin? No, `-w` expects arg. Check man page).
    *Update*: For macOS `security`, use `-w` flag *without* a value to imply stdin reading if supported, OR use an interactive pipe. If `security` cli forces arg, warn user or move to native binding (node-gyp) for true security.
    ```
