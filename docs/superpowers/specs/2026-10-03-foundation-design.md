# 桌面模板基础修复设计

## 目标与范围

依据用户已批准的评审建议，修复质量检查、共享样式、HTTP 请求边界及原生构建配置，并正式接入 shadcn/Base UI。保留现有 Tauri 2 + React + Vite 与源码共享包结构。本轮不添加新业务页面、路由、状态管理、数据库或原生插件。

## 设计

- 根目录提供真实 ESLint、全仓格式检查、Vitest 和 preflight；共享配置放在 packages/config。取消空检查脚本和吞错。ESLint 使用其支持的 TypeScript 6 解析器，应用继续使用 TypeScript 7。
- HTTP 接口保持现有泛型调用兼容；增加可选响应 schema（parse 接口，支持 Zod）。统一错误回调仅执行一次；预取消不发送请求，执行中取消与超时使用明确错误类型；计时器和监听器始终清理。
- packages/ui 承载 shadcn Base UI 组件、工具与主题 CSS；组件直接从 cn 包导入，旧工具入口只转导出 cn；配置 app/UI 的 components.json 和源码子路径 exports。保留 UiButton、UiCard 名称兼容入口，移除未实现的 asChild，使用 Base UI 的 render 或 buttonVariants。共享样式明确扫描 UI 源文件。
- 先加入基础表单、弹窗、反馈与布局组件（Button、Card、Input、Field、Select、Checkbox、Switch、Dialog、AlertDialog、Tooltip、DropdownMenu、Toast、Tabs、ScrollArea、Separator、Skeleton）。示例应用使用共享 Button/Card/Input 验证集成。
- 保留 Tailwind 主题颜色；主题 CSS 归 UI 包。暗色 Provider 本轮不引入，避免扩大用户流程。
- 原生构建关闭 Turbo 缓存，保留前端缓存；移除 Windows 专用 target-dir，允许开发者通过 CARGO_TARGET_DIR 自行选择；默认 Cargo 输出、清理与文档一致。
- 使用 workspace exports 解析共享包，移除重复/错误别名。测试覆盖 HTTP 边界、组件交互、官方 Tauri mockIPC 与共享样式构建。

## 验收

安装和锁文件一致；preflight 与前端构建通过；HTTP 回归测试、可访问组件交互测试与 greet IPC 测试通过；生产 CSS 包含共享组件样式；原生构建不读取旧缓存。当前机器缺少 Cargo 时如实报告原生打包未验证。
