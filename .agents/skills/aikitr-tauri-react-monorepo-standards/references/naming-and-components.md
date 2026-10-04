# 命名、React 与 shadcn 组件

## 1. 命名默认与例外

| 对象                          | 默认                                          | 示例                                                |
| ----------------------------- | --------------------------------------------- | --------------------------------------------------- |
| JS/TS 手写目录、文件          | `kebab-case`，业务含义优先                    | `file-library/`、`rename-file-dialog.tsx`           |
| React 组件、类型、接口、class | `PascalCase`                                  | `RenameFileDialog`、`FileLibraryClient`             |
| 函数、变量、字段、schema 实例 | `camelCase`                                   | `renameFile`、`fileEntrySchema`、`fileId`           |
| hook 文件 / 导出              | `use-<intent>.ts` / `use<Intent>`             | `use-file-search.ts` / `useFileSearch`              |
| 业务状态文件 / store hook     | `<feature>-store.ts` / `use<Feature>Store`    | `file-selection-store.ts` / `useFileSelectionStore` |
| 上下文 / Provider             | `<concept>-context.tsx` / `<Concept>Provider` | `file-library-context.tsx` / `FileLibraryProvider`  |
| 组件 Props                    | `<Component>Props`                            | `RenameFileDialogProps`，留在组件附近               |
| 请求/响应协议                 | `<Operation>Request/Response`；必要时 `Dto`   | `RenameFileRequest`，不要把所有类型都加 Dto         |
| 模块级常量                    | 稳定配置用 `UPPER_SNAKE_CASE`                 | `DEFAULT_PAGE_SIZE`；局部 `const` 不强制大写        |
| 布尔值 / 事件                 | 表达状态 / `on<Intent>`、`handle<Intent>`     | `isLoading`、`canRename`、`onRename`                |
| 包名                          | scope + 明确职责的 kebab-case                 | `@repo/ui`、`@repo/file-library-core`               |
| Rust 文件、模块、函数、字段   | `snake_case`                                  | `file_library.rs`、`rename_file`                    |
| Rust struct/enum/trait        | `PascalCase`                                  | `FileEntry`、`FileLibraryError`                     |
| IPC command / 前端 wrapper    | `snake_case` / `camelCase`                    | `rename_file` / `renameFile`                        |
| 测试文件                      | 邻近 `*.test.ts(x)`；流程 `*.spec.ts`         | `rename-file-dialog.test.tsx`                       |
| Storybook 文件（使用时）      | 邻近 `*.stories.tsx`                          | `button.stories.tsx`                                |

框架保留文件名、文件路由语法、生成文件、上游组件命名遵循其工具要求，例如 `__root.tsx`、`$fileId.tsx`、Next 的 `page.tsx`、Rust 的 `main.rs`。已有 PascalCase TSX 文件若全仓一致，不为样式偏好批量改名；迁移时处理大小写敏感文件系统与引用。

采用 `userId`、`httpClient` 等可读缩略词，不用 `IUser`、`TUser`、`data2`、`manager`、`helper` 掩盖职责。shadcn 原语保留 `Button`、`Card`、`Dialog`；业务组件用 `RenameFileDialog`，不为全部原语增加 `Ui`、`App`、公司名等前缀。确有重名时在消费位置使用 import alias。

TypeScript 默认 named export，路由器要求 default export 时遵从框架。纯类型使用 `import type` / `export type`。边界输入用 `unknown` 后解析，禁止用 `any` 或类型断言逃过外部数据验证。业务结果优先可辨别联合类型，避免多个独立布尔量制造不可能的状态；公共函数的返回与错误契约应明确。

## 2. 组件职责与 API

- `packages/ui` 是视觉基础设施；`SearchInput` 可为通用输入组合，但 `FileSearchInput`、权限判断和重命名 mutation 属于文件库功能。
- 组件 API 表达产品意图，用 `variant/size` 承载设计系统变化，避免大量互相冲突的布尔 Props。复杂组合保留合理的 children/slot；不要包装所有组件仅为换名。
- 表单草稿、弹窗开关等保持局部状态；组件通过值和回调协作。请求、持久化与业务规则在功能 hooks/客户端中协调，不把每次点击的网络请求塞入通用 Button。
- 计算可得的状态在渲染时推导，用户动作在事件处理中执行；Effect 用于订阅等外部同步，不建立 Effect 链同步可推导状态。只有已证实的性能问题才添加 memo、useMemo、useCallback。
- React 19 及以后可按当前库支持传递 ref；已生成组件保留实际底座要求。不能机械删掉 forwardRef 或丢弃传入的 ref、事件、ARIA 属性，导致组合失效。
- 异步界面定义加载、空结果、失败、重试、部分结果和成功反馈；确认弹窗与普通编辑弹窗分清。长任务有进度或取消设计，窗口关闭后不继续无主更新。

## 3. shadcn：先识别实际底座

读取 `components.json`、已生成组件的 imports、包版本及当前官方文档，确认 Base UI、Radix 或其他底座和 style。CLI 版本、生成源码版本、底座版本是不同概念；源码组件不会因为升级 CLI 自动更新。

当前官方 2026-09 更新规定注册表组件直接使用：

```ts
import { cn } from "cn";
```

旧 `lib/utils.ts` 可以保留 `export { cn } from "cn"` 的兼容入口。依赖 `cn` 的包自行声明依赖；不要给整个 monorepo 规定一个跨所有运行环境的 `utils/cn` 实现。迁移 `clsx + tailwind-merge` 前检查直接调用与扩展配置，并核对最新官方迁移能力。不要把“版本号最大”与“当前组件来源、语义和兼容性正确”混为一谈。

| 底座/用途            | 组合方式与要求                                                                                  |
| -------------------- | ----------------------------------------------------------------------------------------------- |
| Base UI trigger      | 当前 API 通常通过 `render` 组合；被组合组件转发所需 Props/ref，避免嵌套 button                  |
| Base UI Button       | 默认按钮语义；需要提交时显式 `type="submit"`                                                    |
| 导航链接呈现按钮外观 | 用真实 `<a>` / 路由 Link，加 `buttonVariants`；不要通过 Base UI Button 的 `render` 强行变成链接 |
| Radix 分支           | 只有底座实际支持时使用 `asChild` / Slot；不要移植到 Base UI 分支                                |

`nativeButton={false}` 不会让 Base UI Button 自动获得链接语义。组合规则按部件确认，不能把 Button 限制泛化成所有 Menu/Navigation 部件都不能渲染链接。

monorepo 中 app 与 ui 的 `components.json` 的组件底座、style、icon library、baseColor 等设计选择保持相容，别名指向真实包导出。Vite 应用不设置 RSC 模式；Tailwind 4 配置遵循当前 CLI 格式，不能搬用旧版 Tailwind 3 配置模板。安装后检查生成文件位置、imports、依赖声明和导出，防止同一原语在多个 app 重复生成。

## 4. 样式、可访问性与平台体验

- 设计 token 与基础主题 CSS 由 ui 所有；应用导入一次，并拥有全局主题选择。用语义颜色、间距与圆角；功能不要另建一套冲突 token。
- Tailwind 使用可静态检测的完整 class 字符串；`bg-${color}-500` 不能替代静态映射。多包样式扫描显式覆盖使用中的共享源码；`@source` 路径以 CSS 文件为基准。
- 保留 CSS 导入副作用。若声明 `sideEffects`，包含实际 CSS/初始化副作用，不为 tree shaking 直接统一写 false。
- 图标按钮有可访问名称，输入有 label，错误与字段关联；Dialog 有标题、合理说明、Esc/焦点管理和退出后焦点归还。通过键盘、可见焦点、对比度验证，不能因为使用 shadcn 就宣称全部可访问。
- 桌面窗口考虑最小尺寸、缩放、系统字体、滚动及 macOS/Windows/WebView 差异。拖动区不吞掉交互控件；系统菜单/快捷键与输入框、组合输入法协调。
- 多窗口各自拥有 providers；主题和偏好需要跨窗口同步时明确同步通道和冲突策略。把所有窗口当成一个 React tree 会遗漏生命周期和缓存隔离。

## 5. 组件与库：按需求引入

| 场景                         | 建议候选                                                                  | 引入条件                                          |
| ---------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------- |
| 基础界面                     | Button、Input、Label/Field、Dialog、AlertDialog、Tooltip、Skeleton、Toast | 页面真实使用；提示不是错误处理策略                |
| 桌面交互                     | DropdownMenu、ContextMenu、Command、Sidebar、Sheet、Resizable、ScrollArea | 对应实际菜单、快捷操作、布局需求                  |
| 多字段表单                   | React Hook Form + Zod，或已采用的 TanStack Form                           | 校验/字段协调复杂；简单表单不必加框架             |
| 数据表格                     | TanStack Table + shadcn 表格组合                                          | 排序/筛选/选择等真实需求；Data Table 是组合实现   |
| 大列表                       | TanStack Virtual                                                          | 已观察到规模或滚动开销，验证可访问性              |
| 跨组件客户端状态             | Zustand                                                                   | 局部状态与 Context 无法清晰表达，且不复制查询数据 |
| 多语言、图表、动画、组件文档 | i18next、Recharts、Motion、Storybook 等候选                               | 有对应产品、文档或验证需求才评估                  |

候选不是安装清单。新增前核对当前维护状态、React/TypeScript/底座兼容性、包体积、许可证与替代方案；同一职责优先一种工具。

共享组件的长期 API 与上游更新见 [设计系统治理](design-system-governance.md)，区域格式与 RTL 见 [国际化](internationalization.md)，依赖引入与许可见 [供应链规范](dependency-governance.md)。

完整页面/流程的可访问性目标与辅助技术验收见 [无障碍规范](accessibility-and-interaction.md)。
