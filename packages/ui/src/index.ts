/**
 * 公共 UI 组件库（shadcn/ui 为基础）
 *
 * 命名规范：
 *   - 基础组件（shadcn 原生）  → UiButton / UiDialog / UiInput
 *   - 业务组件（跨 feature 复用）→ AiUserAvatar / AiFileExplorer / AiCommandPanel
 *
 * 注意：
 *   - 组件不得包含业务逻辑（service 调用 / 状态变更等）
 *   - 组件不得依赖 TanStack Query、Zustand store 或 feature 内部代码
 *   - 所有类名必须经 cn() 合并
 */

export * from "./button";
export * from "./card";
