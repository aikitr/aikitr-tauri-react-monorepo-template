/**
 * 生成 packages/* 通用 tsconfig 片段（便于未来集中微调）
 * 目前主要是类型提示，真实配置在各包的 tsconfig.json 中。
 */

export const PACKAGE_TS_BASE = {
  extends: "../../tsconfig.json",
  compilerOptions: {
    noEmit: true,
  },
  exclude: ["node_modules", "dist", "coverage"],
} as const;
