import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "tooling",
          root,
          environment: "node",
          include: ["tests/**/*.{test,spec}.ts"],
        },
      },
      {
        test: {
          name: "api",
          root,
          environment: "node",
          include: ["packages/api/src/**/*.{test,spec}.ts"],
          restoreMocks: true,
        },
      },
      {
        test: {
          name: "ui",
          root,
          environment: "jsdom",
          include: ["packages/ui/src/**/*.{test,spec}.{ts,tsx}"],
          setupFiles: ["tests/setup-dom.ts"],
          restoreMocks: true,
        },
      },
      {
        test: {
          name: "desktop",
          root,
          environment: "jsdom",
          include: ["apps/desktop/src/**/*.{test,spec}.{ts,tsx}"],
          setupFiles: ["apps/desktop/src/test-setup.ts"],
          restoreMocks: true,
        },
      },
    ],
  },
});
