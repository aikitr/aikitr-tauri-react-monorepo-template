/**
 * Vitest 全局 setup 文件
 *
 * 在此初始化：
 *   - DOM 扩展（matchers 等）
 *   - 全局 mock
 *   - 环境变量注入
 */

// Tauri invoke 全局 mock（避免测试环境尝试连接 Rust 侧）
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).__TAURI__ = null;
