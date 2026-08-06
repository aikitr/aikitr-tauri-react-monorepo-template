# aikitr-desktop

Enterprise-grade cross-platform desktop application built with **Tauri v2**, **React 19**, **TypeScript**, and a **pnpm + Turborepo** monorepo.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Desktop runtime | Tauri v2 (Rust) |
| Frontend | React 19 + TypeScript |
| Bundler | Vite |
| Styling | Tailwind CSS v4 + shadcn/ui |
| State (client) | Zustand |
| State (server) | TanStack Query |
| Validation | Zod |
| Monorepo | pnpm workspace + Turborepo |

## Prerequisites

- Node.js `>= 20.19`
- pnpm `>= 10` (managed via Corepack)
- Rust (stable) + Cargo
- Tauri v2 system dependencies (see [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/))

## Workspace Layout

```
aikitr-desktop
├── apps/
│   └── desktop/          # Tauri + React application
│       ├── src/          # Frontend source (Feature Based Architecture)
│       └── src-tauri/    # Rust backend
├── packages/
│   ├── ui/               # shadcn-based shared UI components
│   ├── icons/            # Icon system
│   ├── utils/            # Shared utilities
│   ├── types/            # Shared TypeScript types
│   ├── api/              # API client
│   ├── auth/             # Authentication abstraction
│   └── config/           # Shared ESLint / TS / Tailwind config
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
└── tsconfig.json
```

## Getting Started

```bash
pnpm install
pnpm dev
```

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start all dev tasks (Turborepo) |
| `pnpm build` | Build all packages & apps |
| `pnpm lint` | Lint all packages |
| `pnpm test` | Run unit tests |
| `pnpm type-check` | Type-check all packages |
| `pnpm format` | Format with Prettier |

## License

MIT
