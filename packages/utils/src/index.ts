/**
 * 通用工具函数集合
 *
 * 所有函数必须：
 *   - 纯函数、无副作用（除了 logger 本身）
 *   - 不依赖 React / 浏览器 / Tauri API（保持跨环境可用）
 */

export { cn } from "./cn";
export { AppError, createResult, ok, err } from "./error";
export { sleep, debounce, throttle } from "./flow";
export { isNonEmptyString, isUUID, isEmail, formatBytes } from "./validate";
