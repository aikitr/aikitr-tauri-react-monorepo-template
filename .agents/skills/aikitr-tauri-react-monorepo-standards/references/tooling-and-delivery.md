# 工作区、质量门禁与交付

## 1. 依赖与包契约

- pnpm workspace 是 JS 包图的来源，内部依赖使用 `workspace:*` 等明确协议；Turborepo 从真实包依赖计算任务图。
- 根 `packageManager` 和工程约定固定 pnpm/Node 工具链，提交 `pnpm-lock.yaml`；应用提交 `Cargo.lock`。版本通过依赖更新 PR 渐进升级，不将某次调研的“最新版本号”写成永久规范。
- pnpm catalogs 集中管理共同依赖版本，包内通过 `catalog:` 引用；特定用途的版本差异可使用具名 catalog 并解释兼容范围，不能靠锁文件碰巧统一。
- React 组件共享包声明实际支持的 React/React DOM peerDependencies；自身开发/测试声明所需 devDependencies。应用拥有 runtime，确认使用单一兼容 React 实例。其他运行依赖仍由所在包声明。
- TypeScript、ESLint、typescript-eslint、Vite、Vitest、Tailwind、Tauri CLI/API、Rust crate 与插件升级按兼容矩阵核对。发现版本号更新不等于所有工具同时支持；不要为了满足“全部最新版”使用大范围 override 强行压制 peer 冲突。
- 包 `exports` 是消费者契约。优先小而稳定的入口，支持的子路径可显式列举或在受控 public 目录使用通配；不得直接暴露全部 src。
- 普通内部包默认 private；可发布包再设计 license、declarations、files、语义版本及 Changesets。桌面应用版本与可发布库版本分开管理。

## 2. 内部包编译策略：两种都有效

| 策略                                      | 适用                                                 | 必须验证                                                                          |
| ----------------------------------------- | ---------------------------------------------------- | --------------------------------------------------------------------------------- |
| Source/JIT：exports 指向 TS/TSX           | 所有消费者使用可编译源码的现代 bundler，内部复用优先 | 消费者能解析依赖/别名、转换源码、生成样式；每个包有类型检查；应用缓存包含共享输入 |
| Compiled：exports 指向 dist JS 与匹配类型 | 需要独立构建缓存、独立运行消费者或 npm 发布          | 上游 build 顺序、JS/CSS/类型产物、导出路径、冷启动与清理后可重建                  |

源码导出无需伪造空 build 脚本；Turborepo 不能缓存它不存在的包级编译任务。compiled 不要求所有包引入 bundler，简单包可用 tsc。发布或裸 Node 消费需验证实际模块格式与导出，不假设 Vite 能运行就代表所有消费者能运行。选择写进 ADR，不将“所有包必须先编译”作为默认最佳实践。

## 3. Turborepo 缓存与任务

| 任务                              | 默认缓存/依赖                     | 输出/输入关注点                                                 |
| --------------------------------- | --------------------------------- | --------------------------------------------------------------- |
| dev                               | `cache: false`、persistent        | 不能作为普通有限任务被等待                                      |
| lint / typecheck                  | 可缓存，无编译产物时 outputs 为空 | 所检查源码、共享配置、工具版本与上游源码                        |
| test                              | 确定性且输入完整时缓存            | 测试源码、fixtures、根 setup/config、共享包；声明 coverage 输出 |
| Web/Vite build                    | 可缓存；compiled 包先 build       | dist、实际环境变量、共享源码、CSS、公开资源                     |
| 原生 check/test/build、签名、发布 | 默认 `cache: false`               | OS、Rust target、toolchain、系统依赖、凭据与外部状态            |

纯 Rust check/test 如需缓存，先证明输入、平台和工具链完整可辨识；发布、上传、签名等外部动作不靠缓存跳过。

必须检查以下具体风险：

1. 声明 `inputs` 会改变默认扫描行为；常规调整以 `$TURBO_DEFAULT$` 为基础，再补根配置等确实需要的输入。
2. JIT 包没有 build 时，仅写 `dependsOn: ["^build"]` 不保证共享源码的变化使应用失效。采用有效的传递输入任务或显式共享输入，并验证真实任务 hash。
3. 测试读取的根 Vitest config、setup、fixtures，和构建读取的 tsconfig、components 配置、主题 CSS、共享源码不能漏掉；不要把 ignored 的 dist/target 加入宽泛输入造成循环失效。
4. `env` 代表影响结果的输入；`passThroughEnv` 仅透传不参与 hash。公开构建配置按实际结果参与 hash，签名变量仅原生发布步骤透传。
5. CI 不先生成共享产物却依赖上一轮缓存才能运行，属于构建链缺陷。至少验证一次干净安装/冷构建；需要修缓存时验证输入变化确实失效。

不要把整仓 `**/*` 永久塞入全局输入。修复缓存针对实际依赖；原生 targetDir 若自定义，Tauri CLI、Cargo 和产物收集一致，不能硬编码另一台机器的 OS/绝对路径。

## 4. 可执行的边界约束

规范只有文字容易退化。落实时优先复用已有工具：

- TypeScript strict、React hooks lint、真实 ESLint 与 formatter；`lint` 不能只是格式检查或 echo。
- 包 exports 限制对外 API；ESLint `no-restricted-imports` 限制 `@repo/*/src/**`、相对跨包路径、共享代码里的 `@tauri-apps/*`/Node，以及 feature 深层导入。
- feature/shared/app 规则要同时覆盖 alias 与相对路径、动态 import 及类型 import 的实际解析；必要时使用 eslint-plugin-boundaries 或 dependency-cruiser 做依赖图检查。不要用一条文本正则宣称完整保证所有边界。
- 包清单检查实际消费是否已声明依赖；需要限制环时在 CI 分析真实模块/包图。工具先试一个真实违规样例和一个正常样例，确认规则不会误报允许的接口依赖。
- 生成文件标记所有者、生成命令与路径；检查产物是否应提交及是否漂移。忽略策略按生成方式制定，不统一忽略所有生成契约。

引入新检查工具是落实阶段的选择；规范设计阶段不安装依赖，也不因本技能自动修改整个仓库配置。

## 5. 验证与 CI 分级

| 变更范围                              | 必要证据                                        | 不能据此推出                  |
| ------------------------------------- | ----------------------------------------------- | ----------------------------- |
| 文案、命名、样式等低影响变更          | 受影响类型/引用/渲染或格式检查                  | 不必增加镜像实现的单元测试    |
| 业务规则、schema、缓存失效、超时/取消 | 有意义的行为与失败场景测试、类型/lint           | 单测替代集成能力              |
| shadcn/表单/交互组件                  | 用户行为、键盘/焦点、必要视觉验证               | 安装组件即全面可访问          |
| IPC/本地权限/文件处理                 | Rust 真实能力测试 + 真实 IPC/权限验证           | JS mock 证明原生通过          |
| workspace/exports/构建缓存            | 干净消费构建、冷/热任务与输入失效检查           | 某次 cache hit 就代表缓存正确 |
| 原生发行                              | 对应目标 OS/架构原生构建、签名/安装与启动 smoke | 浏览器页面可用即桌面可发布    |

前端 CI 使用冻结锁文件安装，按本次变更风险、实际应用/包和仓库已规定的门禁运行必要 lint、typecheck、相关 test 与前端 build；缩减到受影响范围时提供选择依据，既有强制门禁不能静默跳过。Rust 变更使用匹配 toolchain 的 `cargo fmt --check`、`cargo clippy --all-targets -- -D warnings`、`cargo test`，必要时按目标 feature/target 检查；命令基于实际 Cargo workspace，不能无依据加 `--all-features`。

原生发布按承诺支持的 macOS/Windows/Linux 和架构建立对应 runners；系统 WebView 不同，不能只在 Chromium 浏览器测一次。自动化驱动支持范围不足的系统，记录人工或替代 smoke 流程。环境缺少 Cargo/系统依赖时，报告原生验证缺失，不把前端成功描述成全部验证通过。

## 6. 发布、文档与迁移

- 版本来源、Tauri 配置、Cargo/应用包版本及 updater manifest 保持明确一致；签名、平台证书/公证、更新签名与密钥轮换按目标平台处理。
- 发布验证安装、首次启动、权限拒绝、更新与偏好/数据迁移；需要持久化迁移时确认中断/回退处理。日志有可追踪标识并脱敏。
- 工程说明记录实际运行命令、环境要求、验证范围；ADR 记录影响长期边界的决定和取舍。提交信息默认 Conventional Commits；是否 squash、分支与发布流程遵从仓库约定。
- 拆包、改名、迁移底座采用小步顺序：公开入口和依赖声明 → 状态/平台边界 → 消费者迁移 → 删除无人使用的兼容入口。不要同时更换路由、状态库、组件底座和目录，仅为达到一个示例树。
- 对已有项目先产出差异表：`现状证据 | 目标规则 | 必须/默认/按需 | 最小迁移 | 验证`。优先环、越界、错误权限、泄漏和不可信缓存，再统一风格。
- 如需在仓库持久化规范，在用户授权下将选定规则写入根 AGENTS.md、专项文档及机器检查；不要复制整个技能到每个目录或声称技能已经自动执行 lint。

生产交付证据与例外格式见 [协作治理](collaboration-and-governance.md)；真实发行性能见 [性能规范](performance-and-resources.md)，漏洞、下载二进制、许可证及产物来源见 [供应链规范](dependency-governance.md)。

测试分层/隔离/重试见 [测试策略](testing-strategy.md)，构建与运行环境见 [配置治理](configuration-and-secrets.md)，支持矩阵/安装与网络见 [平台兼容](platform-compatibility-and-distribution.md)，实际规则映射和模板见 [落地与维护](standards-adoption-and-maintenance.md)。
