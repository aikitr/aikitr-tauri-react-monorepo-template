# Foundation and Base UI Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task by task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Repair the reviewed defects and provide working shared Base UI components.
**Architecture:** Keep existing workspace packages and source exports. Centralize lint/test configuration and UI styles; retain API call compatibility.
**Tech Stack:** Tauri 2, React 19, TypeScript 7, Vite 8, Tailwind 4, shadcn/Base UI, ESLint, Vitest.
**Spec:** ../specs/2026-10-03-foundation-design.md

## Global Constraints

- Preserve existing dependency upgrade changes and generic HTTP callers.
- Application compiler remains TypeScript 7; lint parser uses supported TypeScript 6.
- No new business features, native plugins, routing, database or state management.
- Keep changes reviewable in the current checkout; do not commit or publish automatically.

## Review Focus

- Abort before fetch sends no request; in-flight abort keeps CANCELLED classification.
- A timeout remains TIMEOUT even when fetch rejects a custom abort reason.
- Schema failure is VALIDATION and onError runs exactly once.
- Dialog keyboard close/focus behavior works; button link styling preserves anchor semantics.
- Shared component classes exist in production CSS; native build cache is disabled.

## Task 1: Real quality gates and regressions

Files: root package.json, eslint.config.js, vitest.config.ts, packages/config/eslint.js, workspace package.json files, tests/setup-dom.ts, .github/workflows/ci.yml.

- [x] Install compatible lint/test dependencies with reproducible lockfile.
- [x] Configure real lint, format, test and preflight commands; untested source packages omit test tasks.
- [x] Write and run HTTP regression tests; expect reviewed cancellation, timeout and callback tests to fail.
- [x] Add frontend CI (install frozen lockfile, preflight, build:frontend).

## Task 2: HTTP request boundary

Files: packages/api/src/index.ts, packages/api/src/index.test.ts.
Interfaces: existing get/post/put/patch/delete<T>(path, init?) remain available; RequestInitLike<T> adds schema?: { parse(data: unknown): T }.

- [x] Fix pre-abort and in-flight cancellation, timeout classification and duplicate callbacks.
- [x] Add optional runtime schema parsing with VALIDATION errors and test success/failure.
- [x] Run API tests; expect all passing, including cleanup and network failures.

## Task 3: Shared Base UI

Files: app/UI components.json, packages/ui/src/components/*, packages/ui/src/lib/utils.ts, packages/ui/src/styles/globals.css, UI exports and compatibility wrappers, apps/desktop/src/App.tsx and styles/globals.css.

- [x] Configure matching base-nova shadcn registries and workspace exports.
- [x] Generate the selected components into packages/ui and inspect added dependencies.
- [x] Preserve UiButton md-size compatibility; remove unsupported asChild and expose buttonVariants.
- [x] Add keyboard/disabled/dialog interaction tests and official Tauri mockIPC app test.
- [x] Verify shared styles in production CSS after build.

## Task 4: Portable build configuration and final verification

Files: .cargo/config.toml, turbo.json, workspace tsconfig files, README.md.

- [x] Remove Windows-specific target directory and disable native build cache.
- [x] Replace brittle custom inputs with default inputs plus shared/root config dependencies.
- [x] Remove shared-package aliases in favor of workspace exports.
- [x] Format, run preflight and frontend build, inspect native dry-run inputs/cache status and final diff.
- [x] Record results and native-toolchain limitation; update README to reflect installed capabilities.

## Verification record

- API regressions: four original defects reproduced, then seven tests passed; schema parsing adds two passing tests.
- UI and desktop: four component interaction tests and two official mockIPC tests passed.
- Independent review found generated cache inputs and missing root test config; two regression tests failed before the fixes and passed afterward.
- Native cache disabled; dry-run includes index.html, Cargo.lock and capabilities.
- Final acceptance: frozen install, full preflight, frontend build and shared CSS inspection. Native packaging remains unverified because Cargo is unavailable.

## cn correction

- Verified the September 2026 official migration and current CLI 4.21.1.
- Restored generated component imports from `cn`, installed cn 0.4.0 through the catalog, and replaced legacy utility implementations with re-exports.
- Removed direct clsx/tailwind-merge dependencies and corrected the README guidance.
