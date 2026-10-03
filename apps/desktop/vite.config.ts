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

  // 只有明确标记为公开的变量进入前端，避免暴露原生签名环境变量。
  envPrefix: ["VITE_"],

  resolve: {
    alias: {
      // 应用内绝对路径导入
      "@": path.resolve(__dirname, "./src"),
    },
  },

  build: {
    // Tauri webview 目标为现代 Chromium，可用 es2022
    target: "es2022",
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
