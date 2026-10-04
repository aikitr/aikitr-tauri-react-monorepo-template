# 资料来源与适用范围

查阅日期：核心与第 01–10 专题为 2026-10-04；第 11–17 专题补充核对为 2026-10-04 至 2026-10-05。链接是权威依据，不代表其中每个示例都适合当前项目。执行版本相关迁移或新增依赖前重新核实当前文档、实际包版本与兼容性；本技能不永久固定“最新版”。

## 大厂公开实践：提取原则，保留适用边界

| 来源                                                                                                                                                                                                                     | 本规范采用                                               | 不直接套用                                                                               |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| [Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html)                                                                                                                                        | 符号命名、清晰标识符、小而明确的模块公开 API             | Google 的内部工具限制、文件名 snake_case 等并非本项目默认；kebab-case 是本技能的团队选择 |
| [Microsoft：Common web application architectures](https://learn.microsoft.com/en-us/dotnet/architecture/modern-web-apps-azure/common-web-application-architectures)                                                      | 业务接口与实现分离、依赖向稳定业务概念、启动层组装适配器 | 不把 .NET 的项目层数、repository 类型及框架直接搬到 React 小功能                         |
| [Vercel Turborepo：Internal Packages](https://turborepo.com/docs/core-concepts/internal-packages) · [官方源码](https://github.com/vercel/turborepo/blob/main/apps/docs/content/docs/core-concepts/internal-packages.mdx) | workspace 包图、JIT/compiled 的实际取舍                  | 不要求所有内部包发布 npm，也不强制独立编译                                               |

这里没有“Google/Microsoft 共同推荐 Tauri 目录树”的依据；业务优先目录、依赖矩阵、包提取条件及团队命名是这些原则与当前栈约束的综合设计。

## 平台与生态的直接依据

| 来源                                                                                                                                                                                         | 用于核实                                                                 |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| [Tauri Architecture](https://v2.tauri.app/concept/architecture/)                                                                                                                             | WebView/Rust/IPC 运行边界                                                |
| [Tauri Calling Rust](https://v2.tauri.app/develop/calling-rust/)                                                                                                                             | command、参数、序列化、返回与错误                                        |
| [Tauri Capabilities](https://v2.tauri.app/security/capabilities/)                                                                                                                            | capability 合并、启用集合、自定义应用命令默认可调用与显式限制、远程来源  |
| [Tauri Next.js](https://v2.tauri.app/start/frontend/nextjs/)                                                                                                                                 | 静态导出与前端产物；该页示例版本较旧，具体 Next API 需再查当前 Next 文档 |
| [Rust API Guidelines：Naming](https://rust-lang.github.io/api-guidelines/naming.html)                                                                                                        | Rust 类型、模块、函数等命名习惯                                          |
| [React：You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect)                                                                                                  | 派生状态、事件处理、外部同步的区别                                       |
| [shadcn Monorepo](https://ui.shadcn.com/docs/monorepo)                                                                                                                                       | app/ui 配置、路径别名、安装归属                                          |
| [shadcn Changelog](https://ui.shadcn.com/docs/changelog)                                                                                                                                     | 2026-09 的 cn 包直接导入及兼容转导出；源码更新与 CLI 更新区分            |
| [Base UI Button](https://base-ui.com/react/components/button)                                                                                                                                | 按钮语义、submit、render/nativeButton 与导航链接限制                     |
| [Base UI Composition](https://base-ui.com/react/handbook/composition)                                                                                                                        | render 组合、属性与 ref 转发；每个部件按自身语义确认                     |
| [Tailwind：Detecting classes](https://tailwindcss.com/docs/detecting-classes-in-source-files)                                                                                                | 完整 class 字符串、多包扫描、相对 CSS 的 @source                         |
| [pnpm Catalogs](https://pnpm.io/catalogs)                                                                                                                                                    | 依赖集中声明及 catalog 引用                                              |
| [TanStack Query：Query Keys](https://tanstack.com/query/latest/docs/framework/react/guides/query-keys)                                                                                       | 参数与查询键、缓存身份                                                   |
| [TanStack Query：Cancellation](https://tanstack.com/query/latest/docs/framework/react/guides/query-cancellation)                                                                             | 消费 AbortSignal 才能取消支持该能力的请求，不推断为 Rust invoke 自带取消 |
| [Turborepo Configuration](https://turborepo.com/docs/reference/configuration) · [官方源码](https://github.com/vercel/turborepo/blob/main/apps/docs/content/docs/reference/configuration.mdx) | inputs、outputs、任务依赖、环境变量与缓存                                |

## 企业级专题的补充依据

下列平台/协议事实已核对；退出协调、存储所有者、例外格式与验收矩阵等是本技能综合形成的团队规则，不意味着每项都由某一家企业或某个 RFC 规定。

| 来源                                                                                                                                                        | 用于核实                                                                      |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| [Tauri Single Instance](https://v2.tauri.app/plugin/single-instance/)                                                                                       | 注册顺序、二次启动参数与唤醒；单实例不替代数据协调                            |
| [Tauri window API](https://v2.tauri.app/reference/javascript/api/namespacewindow/) · [app API](https://v2.tauri.app/reference/javascript/api/namespaceapp/) | 窗口关闭监听与原生应用能力；退出方案需按所用 API 验证                         |
| [Tauri path API](https://v2.tauri.app/reference/javascript/api/namespacepath/)                                                                              | 配置、数据、缓存、日志、资源等路径的不同语义                                  |
| [Tauri SQL](https://v2.tauri.app/plugin/sql/)                                                                                                               | 插件能力与迁移配置；不推定插件提供业务授权或降级兼容                          |
| [SQLite Online Backup](https://sqlite.org/backup.html) · [WAL](https://sqlite.org/wal.html)                                                                 | 活跃数据库一致备份、WAL 持久化与不能只复制主文件                              |
| [Tauri Logging](https://v2.tauri.app/plugin/logging/)                                                                                                       | Rust/前端日志目标、过滤与平台实现                                             |
| [OpenTelemetry Logs Data Model](https://opentelemetry.io/docs/specs/otel/logs/data-model/)                                                                  | 时间、severity、attributes、trace/span 关联；采用字段不等于必须接入 OTel 平台 |
| [React Profiler](https://react.dev/reference/react/Profiler)                                                                                                | profiling 的额外开销与生产构建条件，不能替代整体性能验收                      |
| [shadcn CLI](https://ui.shadcn.com/docs/cli)                                                                                                                | 组件生成、覆盖与预览能力；实际调用核对当前参数                                |
| [GitHub CODEOWNERS](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners)  | 所有者与 required review 的不同作用及实际配置                                 |
| [GitHub Actions Secure Use](https://docs.github.com/en/actions/reference/security/secure-use)                                                               | 固定 action commit、token 最小权限、不受信输入/代码与凭据隔离                 |
| [RFC 8252：OAuth for Native Apps](https://www.rfc-editor.org/rfc/rfc8252.html)                                                                              | 外部 user-agent、public native client 与 PKCE                                 |
| [RFC 9700：OAuth Security BCP](https://www.rfc-editor.org/rfc/rfc9700.html)                                                                                 | 当前 OAuth 安全约束、refresh token 防重放与 rotation                          |
| [RFC 9110：HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110.html)                                                                                     | 幂等、请求结果与重试边界；业务 outbox/去重协议仍需具体实现                    |
| [MDN navigator.onLine](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/onLine)                                                                   | 连接提示不能证明后端可达                                                      |
| [ECMA-402 Intl](https://tc39.es/ecma402/) · [MDN Intl](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl)               | locale-aware 日期、数值、排序的 API 与规范；不规定业务金额计算                |
| [i18next TypeScript](https://www.i18next.com/overview/typescript)                                                                                           | 翻译资源/key 的类型支持；只在采用该工具时适用                                 |
| [pnpm Settings](https://pnpm.io/settings)                                                                                                                   | 安装与 build-script 控制随版本变化，实际配置先核对                            |
| [SLSA 1.2](https://slsa.dev/spec/v1.2/) · [Provenance](https://slsa.dev/spec/v1.2/provenance)                                                               | 产物来源与构建信任范围，不能仅有签名就声称达到某等级                          |
| [CycloneDX specification](https://cyclonedx.org/specification/overview/)                                                                                    | SBOM 等供应链信息的标准格式候选，不要求所有项目固定同一工具                   |

## 安全、测试、治理与平台的补充依据

| 来源                                                                                                                       | 用于核实                                                                            |
| -------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| [Tauri Security](https://v2.tauri.app/security/)                                                                           | 平台边界与安全机制；不推定 capability 代替业务授权或威胁分析                        |
| [OWASP Threat Modeling](https://cheatsheetseries.owasp.org/cheatsheets/Threat_Modeling_Cheat_Sheet.html)                   | 数据流/信任边界、威胁、缓解与验证；不要求所有项目同一分析方法                       |
| [OWASP File Upload](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html)                           | 外部文件/归档入口、限制与分层控制；服务器上传示例不直接搬为桌面实现                 |
| [MITRE CWE-367](https://cwe.mitre.org/data/definitions/367.html)                                                           | 检查与使用之间对象变化风险；具体句柄/目录 API 按目标平台验证                        |
| [Testing Library Guiding Principles](https://testing-library.com/docs/guiding-principles/)                                 | 以真实使用方式验证可观察行为，不以私有实现细节作为主要契约                          |
| [Vitest Test Context](https://vitest.dev/guide/test-context.html)                                                          | fixture/context 与作用域清理能力；具体版本 API 需核实                               |
| [Tauri WebDriver](https://v2.tauri.app/develop/tests/webdriver/)                                                           | 当前驱动模式、测试构建插件与平台支持；不永久沿用旧的 macOS 支持结论                 |
| [Vite Env and Modes](https://vite.dev/guide/env-and-mode)                                                                  | 构建替换、公开 VITE_*、mode 与加载优先级；安装后动态配置须另实现                    |
| [OWASP Secrets Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)             | 用途、访问、轮换、撤销及恢复；不强制模板使用云端 vault                              |
| [OWASP User Privacy Protection](https://cheatsheetseries.owasp.org/cheatsheets/User_Privacy_Protection_Cheat_Sheet.html)   | 数据最小化与用户信息保护；具体保留/删除流程是本技能团队工程规则，不代表法律合规结论 |
| [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/)                                                                              | A/AA 成功标准、完整页面/流程与声明范围；原生 OS 交互另做平台验收                    |
| [Tauri Distribution](https://v2.tauri.app/distribute/)                                                                     | 平台安装包、签名与分发入口；实际发行支持由产品验证确定                              |
| [Microsoft WebView2 Distribution](https://learn.microsoft.com/en-us/microsoft-edge/webview2/concepts/distribution)         | Evergreen/固定 runtime 与部署、更新责任；不把页面某版本号永久写为产品支持范围       |
| [OWASP Transport Layer Security](https://cheatsheetseries.owasp.org/cheatsheets/Transport_Layer_Security_Cheat_Sheet.html) | 可信证书、主机身份和传输保护；企业 CA/代理兼容须验证各实际通道                      |

第 17 项的规则映射、修订和模板是本技能的团队默认；由现有责任、证据与版本控制原则形成，不宣称某家公司规定这七份文件或统一审查周期。

补充参考：[OWASP SSRF Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html) 支持原生/后端代取 URL 的用途与地址/重定向边界分析；[W3C ARIA APG](https://www.w3.org/WAI/ARIA/apg/) 支持控件语义和键盘交互模型，示例仍需在实际消费者与辅助技术验证。

## 维护方法

新证据改变技术规则时更新对应章节和查阅日期。已有项目偏离团队默认时记录取舍即可；涉及协议正确性、授权、平台运行或构建缓存的缺陷，需实际验证后修正。评审引用具体章节与证据，不用“大厂都这样”代替理由。
