import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ESM 兼容：用 import.meta.url 替代 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Tauri 期望固定端口 1420，且不允许 Vite 自动切换端口
const host = process.env.TAURI_DEV_HOST;

// https://vite.dev/config/
export default defineConfig(async () => ({
  plugins: [react(), tailwindcss()],

  // Tauri 要求固定端口 + 不清屏，保证 Rust 侧能正确探测前端就绪
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 忽略 Rust 产物变更触发不必要的前端重载
      ignored: ["**/src-tauri/**"],
    },
  },

  // 暴露 VITE_ 和 TAURI_ 前缀的环境变量
  envPrefix: ["VITE_", "TAURI_"],

  resolve: {
    alias: {
      // 应用内绝对路径导入
      "@": path.resolve(__dirname, "./src"),
      // Monorepo 内部包直连源码（免构建，DX 最优）
      "@aikitr-desktop/ui": path.resolve(__dirname, "../../packages/ui/src"),
      "@aikitr-desktop/icons": path.resolve(
        __dirname,
        "../../packages/icons/src",
      ),
      "@aikitr-desktop/utils": path.resolve(
        __dirname,
        "../../packages/utils/src",
      ),
      "@aikitr-desktop/types": path.resolve(
        __dirname,
        "../../packages/types/src",
      ),
      "@aikitr-desktop/api": path.resolve(__dirname, "../../packages/api/src"),
      "@aikitr-desktop/auth": path.resolve(
        __dirname,
        "../../packages/auth/src",
      ),
    },
  },

  build: {
    // Tauri webview 目标为现代 Chromium，可用 es2022
    target: "es2022",
    minify: "esbuild" as const,
    sourcemap: false,
    rollupOptions: {
      output: {
        // 入口 chunk 命名，便于 Tauri CSP 白名单
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
    },
  },
}));
