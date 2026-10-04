---
name: aikitr-tauri-react-monorepo-standards
description: Use when defining, implementing, reviewing, or migrating enterprise conventions in Tauri 2 and React pnpm/Turborepo monorepos with shadcn/ui, including architecture, naming, platform and data boundaries, runtime, UI, security, testing, configuration, privacy, accessibility, compatibility, dependencies, release governance, and standards adoption. Applies to desktop-first and shared desktop/web projects.
---

# Aikitr Tauri + React Monorepo 工程规范

规范修订：2026-10-05。项目采纳时记录实际来源修订/内容摘要，精确引用规则与验收范围。

用于建立、执行和评审一套可演进的团队规范。默认组合为 Tauri 2、React、TypeScript、Vite、pnpm workspace、Turborepo、Tailwind CSS 和 shadcn/ui。具体版本与组件底座以当前项目和官方兼容性为准。

## 规则等级

- **必须**：平台正确性、明确的依赖边界、数据与权限边界；不满足时说明实际缺陷。
- **默认**：本规范选择的团队约定；已有一致且有效的方案可以保留，变更用 ADR 说明理由。
- **按需**：有实际业务、复用或发布需求才引入；不创建空目录、空包或全套预装组件。

企业级专题小节使用稳定规则组 ID（如 `STORAGE-WRITE`）。评审、例外与门禁记录同时引用 ID、具体条款和等级；同一组内可以包含不同等级，不能把默认方案整体判作强制要求。ID 不因章节排序改变而重编；规则退役后不复用旧 ID。

Google 的 TypeScript 风格、Microsoft 的依赖倒置和官方框架资料提供依据；这里的目录组合、kebab-case 文件名及包拆分策略是针对本技术栈的团队默认。不要宣称存在所有大厂统一采用的目录规范。依据见 [资料与适用范围](references/sources.md)。

## 使用流程

1. 读取项目说明、现有约束、workspace 清单、包导出、路由、原生配置与验证脚本；确认应用数量、平台、部署方式、是否发布 npm 包。
2. 按任务读取下面相应章节。评审现状与设计目标分别列出，不把现有目录当作最佳实践证据。
3. 为新模块明确：业务归属、公开入口、依赖方向、状态所有者、平台适配器、验证方式。复用需求尚未出现时先留在所属应用；按实际启用能力选择企业级专题，不为未启用能力建设空系统。
4. 修改时沿既有有效边界渐进实施。用户只要求规范或评审时交付规范、差异与迁移建议；实际重构以用户授权范围为准。
5. 汇报实际运行的检查、具体未验证项及影响；前端 mock 通过不能推出 Rust 或原生发布已通过。

## 按任务加载

| 任务                                              | 读取                                                 |
| ------------------------------------------------- | ---------------------------------------------------- |
| 新模块、目录评审、共享包、Web 共用、依赖边界      | [目录与架构](references/architecture.md)             |
| 文件与符号命名、React/shadcn 组件、样式、组件选型 | [命名与组件](references/naming-and-components.md)    |
| HTTP、IPC、查询缓存、状态、持久化、Rust、权限     | [数据与原生边界](references/data-and-native.md)      |
| 依赖升级、包导出、缓存、质量检查、CI、发布、迁移  | [工程工具与交付](references/tooling-and-delivery.md) |
| 核实官方依据、版本相关规则、解释大厂实践来源      | [资料与适用范围](references/sources.md)              |

## 企业级专题（按补充顺序）

这些章节按任务加载；生产交付和跨团队评审同时读取第 06 项，形成负责人、证据与例外记录。

| 顺序 | 任务与章节                                                                                                       |
| ---- | ---------------------------------------------------------------------------------------------------------------- |
| 01   | [桌面生命周期](references/desktop-lifecycle.md)：启动、就绪、关闭/托盘、单实例、多窗口、任务退出                 |
| 02   | [本地存储与迁移](references/storage-and-migrations.md)：数据归属、并发、原子写入、schema、降级、备份恢复         |
| 03   | [错误与可观测性](references/errors-and-observability.md)：错误契约、关联日志、脱敏、诊断、遥测与审计             |
| 04   | [性能与资源](references/performance-and-resources.md)：发行基线、预算、IPC、并发/背压、资源释放                  |
| 05   | [设计系统治理](references/design-system-governance.md)：token、公共 API、上游更新、消费者与交互验收              |
| 06   | [协作与规范治理](references/collaboration-and-governance.md)：能力分级、模块责任、PR、ADR、例外、发布与恢复      |
| 07   | [身份与会话](references/identity-and-sessions.md)：认证协议、凭据、刷新协调、授权、退出与身份切换                |
| 08   | [离线与同步](references/offline-and-sync.md)：能力承诺、outbox、幂等、冲突、调度、重启恢复                       |
| 09   | [国际化](references/internationalization.md)：文案所有权、语言/时区、日期数值、RTL、输入与验收                   |
| 10   | [依赖与供应链](references/dependency-governance.md)：引入/升级、二进制、漏洞、许可证、SBOM 与产物来源            |
| 11   | [安全设计与威胁建模](references/security-and-threat-modeling.md)：资产、信任边界、文件/执行入口、风险处置        |
| 12   | [测试策略](references/testing-strategy.md)：分层、契约、mock 边界、fixtures、隔离、重试与失败证据                |
| 13   | [配置与密钥](references/configuration-and-secrets.md)：构建/运行来源、环境、轮换、动态配置与 flag                |
| 14   | [隐私与数据生命周期](references/privacy-and-data-lifecycle.md)：清单、访问/导出、保留、删除协调与防复活          |
| 15   | [无障碍与交互](references/accessibility-and-interaction.md)：适用目标、语义、焦点、辅助技术与声明范围            |
| 16   | [平台兼容与企业分发](references/platform-compatibility-and-distribution.md)：支持矩阵、安装/卸载、网络与受管环境 |
| 17   | [规范落地与维护](references/standards-adoption-and-maintenance.md)：实际控制映射、七类交付模板、修订与退役       |

各专题给出适用条件、所有者、具体规则和验收证据。已经启用的能力必须满足相应边界与验证；未启用的能力注明不适用。预算、容量、保留期限、漏洞 SLA 等参数由产品目标、测量和风险确定并记录，不照搬全项目通用数字。

跨边界或生产设计按风险同时读取第 11 项，制定验证方案读第 12 项；复制工程模板、采纳/升级规则或设计机器门禁读第 17 项，再按任务选择其中资产。模板初始状态为待评审/待验证，不能把空字段或未运行检查转换成通过。

## 架构主线

```text
应用组装 app/routes ──→ 业务 features ──→ 应用内 shared / 共享 packages
       │                    ↑
       └──→ 平台适配器 ──────┘  依赖业务公开契约，由应用注入

共享 packages 不依赖 apps；包与功能的依赖图保持无环。
```

- 路由负责入口和组合，功能拥有业务，`ui` 拥有无业务含义的视觉组件。
- feature 深层实现、其他应用源码、未导出的包路径不是公共 API。
- HTTP/IPC 返回值和本地持久化数据在边界校验；TypeScript 泛型不能代替运行时验证。
- React 共享代码不直接依赖 Tauri、Node、应用环境变量或凭据；通过注入的能力接口协作。
- 当前新版 shadcn 使用 `import { cn } from "cn"`；旧辅助入口可兼容转导出。Base UI 与 Radix 的组合 API 必须区别处理。
- 源码导出的内部包是有效方案；缓存需覆盖真实输入，原生构建与签名默认不作为可复用的 Turbo 构建结果。

## 输出约定

规范设计给出目标树、依赖表、命名映射和实施顺序。评审给出“实际证据 → 违反的规则等级 → 影响 → 最小修正”，区分阻断问题和团队偏好。生产能力另列所有者、验证环境/证据、未验证项、期限明确的例外与兼容/恢复方式；区分规范要求、实际实现和已验证结果。不要只因文件夹名称不同或没有安装推荐库就认定项目不合格。
