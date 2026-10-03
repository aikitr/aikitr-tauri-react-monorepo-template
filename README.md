# aikitr-desktop

A desktop application template built with **Tauri 2**, **React 19**, **TypeScript**, and a **pnpm + Turborepo** monorepo.

## Tech Stack

| Layer           | Installed technology                            |
| --------------- | ----------------------------------------------- |
| Desktop runtime | Tauri 2 (Rust)                                  |
| Frontend        | React 19 + TypeScript 7                         |
| Bundler         | Vite 8                                          |
| Styling         | Tailwind CSS 4 + shadcn/ui (Base UI, base-nova) |
| Validation      | Zod; optional response schema in the API client |
| Quality         | ESLint 10, Prettier, Vitest, Testing Library    |
| Monorepo        | pnpm workspace + Turborepo                      |

Zustand and TanStack Query are optional catalog entries, not installed application features. The authentication package provides backend adapters; it does not yet provide a session provider or secure token storage.

## Prerequisites

- Node.js 22 (`>= 22.22.2`), 24 (`>= 24.15.0`), or 26+
- pnpm 12.7.0 (pinned in `packageManager`)
- Rust (stable) + Cargo for native development and packaging
- [Tauri system prerequisites](https://v2.tauri.app/start/prerequisites/)

The shared ESLint package uses TypeScript 6.0.3 internally because the installed typescript-eslint supports versions below 6.1. Application type checking continues to use TypeScript 7.0.2.

## Workspace Layout

```text
aikitr-desktop
├── apps/desktop/
│   ├── src/app/providers/ # Global UI providers
│   ├── src/lib/services/  # Native command adapters
│   ├── src/              # Application and feature code
│   └── src-tauri/        # Rust backend and capabilities
├── packages/
│   ├── ui/               # Shared components, utilities and theme CSS
│   ├── icons/            # Application icon aliases
│   ├── utils/            # Shared utilities and errors
│   ├── types/            # Cross-package contracts
│   ├── api/              # HTTP client and response parsing
│   ├── auth/             # Authentication backend adapters
│   └── config/           # Shared ESLint configuration and TS helpers
├── tests/                # Shared DOM test setup
├── vitest.config.ts      # API, UI, desktop and tooling test projects
└── .github/workflows/    # Frontend CI checks
```

Shared packages export TypeScript source directly; they do not require placeholder build tasks. Application business logic belongs in `apps/desktop`; UI components must not depend on application features or native commands.

## Getting Started

```bash
pnpm install
pnpm dev:frontend # Browser preview; native commands require Tauri
pnpm dev          # Native application; requires Rust and system prerequisites
```

## Scripts

| Command               | Description                                               |
| --------------------- | --------------------------------------------------------- |
| `pnpm preflight`      | Type checks, lint, full-repository format check and tests |
| `pnpm build:frontend` | Build frontend assets                                     |
| `pnpm build:desktop`  | Package the native application                            |
| `pnpm lint`           | Check source, configuration and tests with ESLint         |
| `pnpm test`           | Run all API, UI and desktop tests; an empty suite fails   |
| `pnpm test:watch`     | Watch tests                                               |
| `pnpm type-check`     | Check workspace source and test code                      |
| `pnpm format`         | Format repository files                                   |

CI installs the frozen lockfile and runs `preflight` and the frontend build. Native packaging still needs verification on the target operating systems.

## Shared UI

Import components through workspace exports:

```tsx
import { Button } from "@aikitr-desktop/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@aikitr-desktop/ui/components/dialog";
```

Installed components: Button, Card, Input, Field, Label, Select, Checkbox, Switch, Dialog, AlertDialog, Tooltip, DropdownMenu, Toast, Tabs, ScrollArea, Separator and Skeleton.

Both app and UI workspaces have matching `components.json` files. Add components with the [shadcn monorepo workflow](https://ui.shadcn.com/docs/monorepo):

```bash
pnpm dlx shadcn@4.21.1 add resizable --cwd apps/desktop
pnpm preflight
```

Generated components import `cn` directly from the `cn` package, following the [September 2026 shadcn update](https://ui.shadcn.com/docs/changelog#september-2026---cn). The existing utility entry points re-export `cn` for compatibility; they do not wrap `clsx` and `tailwind-merge`. The shared theme imports animation styles and explicitly scans the UI source directory. Application styles import `@aikitr-desktop/ui/globals.css`. A dark theme and theme-switching provider are not implemented yet.

`UiButton` and `UiCard` remain compatibility exports. `UiButton` maps `size="md"` to the new default size. Base UI composition uses `render`, not `asChild`. To style a semantic link, use `buttonVariants` on an `<a>` element.

Global tooltip and toast providers are mounted in `AppProviders`.

## HTTP Response Validation

Existing `api.get<T>(path, init)` calls remain supported, but a generic type alone does not validate a response. Use a schema for runtime validation:

```ts
import { z } from "zod";
import { createApiClient } from "@aikitr-desktop/api";

const api = createApiClient({ baseUrl: "https://api.example.com" });
const user = await api.get("/user", {
  schema: z.object({ id: z.string(), name: z.string() }),
  timeoutMs: 10_000,
});
```

Declare Zod in the consuming workspace when using this example. Schema failures use `VALIDATION`; user cancellation uses `CANCELLED`; timeouts use `TIMEOUT`. The global error callback executes once per failed request.

Desktop tests use Tauri's official `mockIPC` and `clearMocks`. Mocking IPC does not validate Rust command implementations.

## Native Build Output

Cargo uses its default `apps/desktop/src-tauri/target` directory. Set `CARGO_TARGET_DIR` in your local environment only when an external output directory is needed; the repository clean task will not delete that external directory.

Native build tasks pass through Cargo/Rust and Tauri signing environment variables. Only `VITE_` variables are exposed to the frontend.

Native Turbo build caching is disabled. Frontend builds remain cached, with shared package source included in their inputs. Native caching should only be enabled after accounting for target platform, toolchain, signing and all build inputs.

## License

MIT
