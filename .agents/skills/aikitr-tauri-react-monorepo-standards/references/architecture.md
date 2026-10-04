# 目录、模块归属与依赖边界

## 1. 技术选型默认

| 范围     | 默认                                                         | 何时调整                                             |
| -------- | ------------------------------------------------------------ | ---------------------------------------------------- |
| 桌面壳   | Tauri 2 + 系统 WebView + Rust                                | 有产品要求才增加移动端或其他壳                       |
| 桌面前端 | React + TypeScript + Vite SPA                                | 现有前端稳定时不为目录规范更换构建器                 |
| 路由     | 需要多页面时用 TanStack Router；保留合理的 React Router 实现 | 单屏应用无需路由库；一个应用选一种路由方案           |
| 数据缓存 | 有异步列表、失效和重试需求时用 TanStack Query                | 简单一次性调用可以保持局部状态                       |
| 组件     | shadcn/ui + 一种明确的组件底座 + Tailwind                    | 已有 Radix 项目不因新项目默认改变而强制迁移          |
| 工作区   | pnpm workspace + Turborepo                                   | Cargo workspace 在多个实际 Rust crate 需要协调时建立 |

新建项目默认选择 shadcn 的 Base UI 分支，便于统一现代 React 组件组合；这属于团队选择，已有其他底座需先评估迁移成本。按产品需要引入 Router、Query、表单和 store，基础组合不意味着这些库全部必装。

Next.js 可以用于 Tauri 的静态前端，但需要满足静态导出限制，不能假设打包后存在 Next 服务端。独立 Web 产品确实需要 SSR、SEO 或服务端路由时，可在 `apps/web` 使用 Next；Tauri 桌面继续使用 Vite。共享代码保持客户端兼容；Server Actions、请求级会话及服务端组件留在 Web 应用。复用 UI 不要求两端采用相同路由框架。

## 2. 目标目录：只创建已有职责

下面为团队默认布局示例，`file-library` 和 `settings` 是示例业务名；不存在的业务与尚未需要的子目录不创建。

```text
repo/
├── apps/
│   └── desktop/
│       ├── package.json
│       ├── components.json
│       ├── vite.config.ts
│       ├── src/
│       │   ├── main.tsx                 # 唯一前端启动入口
│       │   ├── app/
│       │   │   ├── app.tsx
│       │   │   ├── providers.tsx        # QueryClient、主题、全局反馈与能力注入
│       │   │   ├── router.tsx
│       │   │   └── layouts/app-layout.tsx
│       │   ├── routes/                 # 薄路由；按所选路由器命名规则
│       │   ├── features/
│       │   │   ├── file-library/
│       │   │   │   ├── index.ts        # 功能公开入口
│       │   │   │   ├── file-library-page.tsx
│       │   │   │   ├── components/
│       │   │   │   │   ├── file-search-input.tsx
│       │   │   │   │   └── rename-file-dialog.tsx
│       │   │   │   ├── api/file-library-queries.ts
│       │   │   │   ├── model/file-library-client.ts
│       │   │   │   └── hooks/          # 多组件共享的功能 hook 才抽取
│       │   │   └── settings/
│       │   ├── platform/
│       │   │   ├── file-library-client.ts  # Tauri 适配器，实现功能公开接口
│       │   │   └── preferences-client.ts
│       │   ├── shared/
│       │   │   ├── components/         # 应用内无业务归属的复用组件
│       │   │   ├── hooks/
│       │   │   ├── lib/                # 实际存在的纯辅助函数
│       │   │   └── config/env.ts       # 浏览器公开配置及校验
│       │   └── styles/app.css
│       ├── public/                    # 原样复制到前端产物的公开资源
│       └── src-tauri/
│           ├── Cargo.toml
│           ├── Cargo.lock
│           ├── tauri.conf.json
│           ├── build.rs
│           ├── capabilities/
│           ├── permissions/           # 自定义命令需要显式权限时
│           ├── icons/
│           ├── src/
│           │   ├── main.rs
│           │   ├── lib.rs             # 注册、启动、原生依赖组装
│           │   ├── commands/          # IPC 入口，参数转换与授权
│           │   └── features/
│           │       └── file_library/  # Rust 业务与本地文件实现
│           └── tests/                 # Rust 集成测试
├── packages/
│   ├── ui/                            # 已实际共用的视觉组件与设计 token
│   └── config/                        # 共同 TypeScript/ESLint 等配置
├── docs/adr/                          # 发生架构决策后才新增文件
├── scripts/                           # 跨任务反复使用的真实工程脚本
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
├── package.json
└── turbo.json
```

小功能从页面和几个同级文件开始。只有内容需要职责分组时才增加 `api/model/components/hooks`，不为满足树形图创建空目录。Rust 的简单应用也可以暂时使用同级模块；发生复杂业务后按功能聚合，而不是让全仓 `services/` 无限增长。

## 3. 代码放在哪里

| 代码                                       | 所属位置                     | 提取条件                                                     |
| ------------------------------------------ | ---------------------------- | ------------------------------------------------------------ |
| 路由声明、导航布局、跨功能组合、依赖实例化 | 应用 `app/` 或 `routes/`     | 通常不进入共享包                                             |
| 文件搜索、重命名、设置表单、功能查询键     | 对应 `features/<feature>/`   | 第二个消费者确实需要同一功能时再提取                         |
| Button、Dialog、表单视觉字段、设计 token   | `packages/ui`                | 无特定业务、无权限和网络请求                                 |
| 应用内通用展示和 hook                      | `shared/`                    | 多应用实际复用且平台无关后再进入包                           |
| HTTP/IPC DTO、运行时 schema、协议版本      | 契约所有者附近               | 多消费者共享协议时建立 `packages/contracts`，按业务分入口    |
| 无 React/IO 的业务规则与能力接口           | 功能 `model/`                | 多应用共享后建立 `packages/<domain>-core`                    |
| 多应用共同业务页面、hooks、查询配置        | 当前应用 feature             | 建立 `packages/<domain>-react`；核心依赖确实复杂时另设 core  |
| 共用 HTTP 传输实现                         | 本应用平台层                 | 多消费者出现后建立 `packages/api-client`；传输与业务接口分清 |
| Tauri invoke、事件、窗口、系统对话框       | `apps/desktop/src/platform/` | 多个桌面应用共用后才建立 `packages/tauri-client`             |
| 授权业务                                   | 所属 auth feature/domain     | 真正复用再建立 `auth-core` / `auth-react`，名称说明运行环境  |
| 一般纯函数                                 | 所属模块优先                 | 独立、稳定、真实复用后放职责明确的工具模块                   |

`contracts` 只集中跨边界协议，不收集全仓所有类型。组件 Props、store 状态、内部 ViewModel 留在所属模块。避免 `types`、`utils`、`common`、`features` 演变为无所有者的杂物包。当前已有这些包时先按真实内容梳理职责；改名本身没有架构收益。

## 4. 依赖矩阵：必须可追踪且无环

以下是源代码依赖方向；原生接口的运行时调用不是 Rust 导入 TypeScript。

| 来源                                   | 可以依赖                                       | 不可以依赖                                       |
| -------------------------------------- | ---------------------------------------------- | ------------------------------------------------ |
| `app/`、`routes/`                      | 功能公开入口、平台适配器、shared、包公开入口   | 其他应用实现源码                                 |
| `platform/`                            | 功能公开能力接口、协议、原生/HTTP 库           | 具体页面、组件或 store 实现                      |
| `features/<name>/`                     | 本功能内部、shared、包公开入口、注入的能力接口 | 兄弟 feature 的深层文件、app、平台具体实现       |
| 应用 `shared/`                         | 本 shared、通用包                              | features、app、platform 业务适配器               |
| `packages/ui`                          | React、所选组件底座、样式工具、纯工具          | 业务 core/contracts、auth、HTTP、Tauri、应用配置 |
| `packages/<domain>-react`              | 自身 core/契约、ui、React 与声明的查询库       | apps、Tauri 实现、服务端专用模块                 |
| `packages/<domain>-core` / `contracts` | 明确声明的纯依赖、契约/schema                  | React、UI、Tauri、HTTP 实现、应用环境            |
| `api-client` / `tauri-client`          | 所实现的协议或 core 能力接口                   | 业务 React UI、apps                              |

功能之间默认由应用组合，用 Props、业务接口和明确的事件沟通。确实需要功能 A 依赖功能 B 时，记录业务理由、稳定公开入口和无环方向；这是有记录的团队约定例外，不允许深层导入 B 的 store、组件或查询实现。双向需求提取共同概念或交给上层组合，不能用 `import type` 掩盖错误归属。

## 5. 公开入口与 imports

- 跨包必须通过 `package.json.exports` 支持的入口，例如 `@repo/ui/components/button`、`@repo/file-library-core`；不得 `../../packages/.../src` 或 `@repo/ui/src/...`。
- `index.ts` 用于功能或包的公开边界，显式导出需要消费的符号；不要为每一层目录建立 barrel。模块内部直接引用实现，避免内部导入自己的公开入口形成环。
- 应用可统一 `@/` 指向本应用 `src`；同功能内部优先相对导入。共享源码包不借用应用 `@/`，优先相对路径或经消费者工具验证的包 `imports`。
- TS `paths` 只是解析配置，不能替代 workspace 依赖声明、包导出或实际运行时解析。
- 包自己的运行依赖由自己的 `package.json` 声明，不能依赖 workspace 根目录碰巧提升出来的依赖。

## 6. 两端共用的演进示例

只有 desktop 时：文件库页面、查询与 `FileLibraryClient` 接口位于 desktop feature；Rust 文件能力通过 desktop 平台适配器注入。设置通过自己的接口加载与保存，不读取文件库内部 store。

真正新增独立 Web 应用时：将已共用的页面与查询提取到 `file-library-react`，协议/纯业务放入 `file-library-core` 或现有合适契约包。desktop 注入 Tauri 客户端，web 注入 HTTP 客户端；两端分别拥有路由、providers、配置、运行与构建入口。不要建立统一 `packages/features` 去承接所有未来业务。只有确实共享全部路由和应用壳的同产品多壳场景，才考虑一个明确命名的共享产品包，并记录取舍。

依赖实例在应用启动/组装层创建。纯业务不调用全局 service locator；共享功能通过 Props、工厂或 Provider 获取能力。Context 是注入方式，不负责替代查询缓存。

采纳或迁移这些边界时，用 [落地规范](standards-adoption-and-maintenance.md) 关联规则、实际控制与证据；不因目标目录树存在就认为检查已实施。
