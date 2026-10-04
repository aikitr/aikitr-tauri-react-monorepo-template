# 数据、状态、IPC 与原生边界

## 1. 状态只有一个明确的所有者

| 状态                              | 默认所有者                       | 约束                                         |
| --------------------------------- | -------------------------------- | -------------------------------------------- |
| 表单草稿、弹窗、hover、一次性选择 | 组件/功能局部 React 状态         | 不为传几个 Props 建全局 store                |
| 可分享的搜索/分页/过滤            | 路由 search params（场景允许时） | query key 使用实际查询参数；导航后恢复一致   |
| HTTP/IPC 异步业务数据             | Query 缓存或功能异步控制层       | 不复制进 Zustand/Context 再双向同步          |
| 跨页面客户端 UI 状态              | 功能 store 或 Provider           | 明确 scope；按窗口/用户实例化必要状态        |
| 可持久化偏好                      | 设置功能 + 持久化适配器          | 版本、默认值、校验、迁移及写入失败可见       |
| 本地文件与受信操作结果            | Rust/后端                        | 前端视图与缓存不能成为授权依据               |
| 身份凭据                          | 平台适配器/认证边界              | 不进入 ui、普通 localStorage、日志或构建环境 |

设置改变文件库排序时，由应用传递偏好或注入明确配置接口；不要让 Settings 深层导入 File Library 的 store。派生值保持派生，偏好持久化不等于远端查询缓存持久化。

## 2. 业务能力与传输分离

共享功能面向业务接口，HTTP 与 Tauri 客户端分别实现。单应用时接口留在 feature；多应用真实复用后再移动到职责清晰的 core/契约包。数据协议和接口可以在小模块共置，不强制建立 repository/service/mapper 三层。

下例展示一个完整的类型接口与运行时边界，使用 schema 的位置仅作适配示例；真实接口的错误类型和分页按业务确定。

```ts
import { z } from "zod";

export const fileEntrySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  relativePath: z.string(),
});
export type FileEntry = z.infer<typeof fileEntrySchema>;

export interface FileLibraryClient {
  search(
    request: { query: string },
    signal?: AbortSignal,
  ): Promise<FileEntry[]>;
  rename(request: { fileId: string; name: string }): Promise<FileEntry>;
}

export function createFileLibraryClient(transport: {
  search(request: { query: string }, signal?: AbortSignal): Promise<unknown>;
  rename(request: { fileId: string; name: string }): Promise<unknown>;
}): FileLibraryClient {
  return {
    async search(request, signal) {
      return z
        .array(fileEntrySchema)
        .parse(await transport.search(request, signal));
    },
    async rename(request) {
      return fileEntrySchema.parse(await transport.rename(request));
    },
  };
}
```

`invoke<T>()`、`fetch<T>()`、`as Response` 只是静态声明；外部数据仍从 `unknown` 解析。协议选择单一所有者：共享 schema、OpenAPI 或 Rust 类型生成绑定择其合理方案，生成代码不手工双份维护。生成绑定仍需验证实际序列化与协议兼容；不要把任意 schema 单独称为 Rust 和 HTTP 均受保护。

## 3. 查询缓存与副作用

- query keys 在功能 API 模块集中定义，由资源类型、身份/工作区范围及所有影响请求的参数组成。不要把函数、token 或巨大可变对象放入 key。
- QueryClient 由应用 providers 拥有，避免每次渲染重建。多窗口各自缓存，账户切换/退出时清除或隔离旧身份数据；跨窗口更新按事件协议失效。
- search 防抖、加载反馈与空结果语义分清。旧请求迟到不能覆盖当前查询；HTTP 将 Query 提供的 AbortSignal 传入 fetch。
- **Tauri invoke 不会因为收到 AbortSignal 自动取消 Rust 任务**。可不支持取消但忽略过期视图更新，或为长任务实现任务 ID、取消命令/状态与结果丢弃。接口接受 signal 时明示适配器是否真正取消底层工作。
- rename 成功后更新准确的列表/详情或使相关 key 失效；乐观更新只在可回滚且冲突规则清晰时使用。不对非幂等修改无条件重试。
- ErrorBoundary 处理渲染异常；请求失败与事件处理失败仍由功能处理。底层提供结构化错误，面向用户的 toast/dialog 由一个确定层负责，避免拦截器、hook、组件各提示一次。

## 4. HTTP 与协议

- HTTP 客户端负责 base URL、认证、超时、取消、序列化与传输错误；端点语义、schema 和业务重试留在所属 API/功能。
- 区分用户取消、超时、网络失败、HTTP 状态、协议解析失败、业务冲突。不要将 abort 一律解释成网络失败；成功/失败后清理计时器与监听器。
- 使用可识别 code 和必要上下文；对 UI 显示安全信息，对内部日志保留 cause/trace ID。跨 IPC 的错误往往不是 JS Error，要在适配器规范化。
- Wire 字段统一 camelCase 是团队默认；Rust 用 `serde(rename_all = "camelCase")` 等显式契约。Tauri command 参数命名与序列化对象命名分别检查；不能认为 struct 的 rename 设置会改变所有 invoke 参数。
- ID、路径、时间、数字与 null 有明确语义。瞬时时间使用明确的 UTC 表示；业务日期和当地日程保留其独立语义，见 [国际化规范](internationalization.md)。超出 JS 安全整数的 Rust 数值以字符串等约定传输；不默认 Date/BigInt 自动保持原类型。
- 协议、缓存、设置文件涉及迁移时有版本和兼容策略；自更新中的前后端不一定在每个时刻同版本。

## 5. Rust 层与任务生命周期

IPC command 保持薄：解析请求、检查来源/权限/业务授权、调用业务能力、转换返回与错误。文件操作、数据库规则、任务管理在所属 Rust 功能模块中，可脱离 WebView 测试。应用启动层负责注册 command 和持有状态。

- 每个 command 的输入是不受信的；客户端参数不是授权事实。能力校验、业务身份校验与路径校验分别承担各自责任。
- 同步文件/CPU 工作不阻塞 UI 对应的原生事件循环或异步 executor；采用合适的异步 IO、工作线程/阻塞任务池。不要把函数标记 async 就认为内部阻塞消失。
- Rust 状态锁不跨 `await` 或长期 IO 持有；显式管理进度、取消、窗口关闭和任务结果。高频/流式数据按需求采用 channel，事件适合广播通知而非假定可靠 RPC。
- 前端监听器卸载时 unlisten；注册本身异步时，处理“已经卸载后才注册完成”的竞态。日志、事件与返回体限制敏感信息与载荷规模。
- 路径以服务端持有的根目录和受约束的文件 ID/相对路径解析。验证 `..`、绝对路径、分隔符、软链接及目标父目录；重命名时处理目标不存在、同名、大小写及平台差异。需要强保证时分析检查与操作之间的竞态，字符串前缀判断不足以保证目录隔离。

## 6. Tauri 权限、配置与凭据

以下为平台要求与默认安全边界，依据见 [Tauri 官方资料](sources.md)：

- capabilities 按实际 window/webview 与目标平台声明最小能力；同一窗口匹配多个 capability 时权限会合并。
- capabilities 目录内文件默认启用；需要限定集合时在 Tauri 配置明确列出，不能把试验权限文件留在目录里认为它不生效。
- **通过 `invoke_handler` 注册的应用自定义命令默认对应用所有窗口/webview 可调用**。要收紧自定义命令，应按官方 `AppManifest::commands`、对应 permissions/capabilities 配置，并验证真实窗口调用。仅删除一个插件 permission 不会自动限制所有应用命令。
- Rust 自己执行的文件操作不会自动继承前端 fs 插件的路径限制；后端仍负责自己的授权与目录隔离。
- 生产 CSP 依据实际 IPC、网络、样式及资源来源显式配置并验证；不能以 `csp: null` 作为通用发布默认。远程页面原生访问默认关闭，明确需求才限定来源与能力。
- `VITE_*` 是公开构建数据，不能存私钥、token 或签名密码；不要将所有 TAURI/RUST/CARGO 变量加入 Vite envPrefix。
- 普通主题/偏好可用 Tauri store 等持久化工具；登录凭据选择有明确威胁模型的系统凭据存储或加密方案。使用 Stronghold 等工具时密钥获取和生命周期也必须设计，不能把密钥写在前端声称已安全。
- deep link、打开外部 URL、shell/sidecar、拖入文件均有输入与来源检查。更新包验证签名；发布私钥和签名密码仅存在受控的发布环境。

## 7. 必须覆盖的边界验证

按本次变更涉及的实际能力与发布承诺选择必须覆盖的边界：前端 mock 验证组件、状态和调用约定；涉及文件业务/访问边界时，Rust 使用临时目录验证真实操作（如搜索/重命名）与越界拒绝；涉及 IPC 契约或权限时，真实 IPC 验证命令名、参数、序列化、错误和权限；原生发行验收用实际安装产物验证承诺系统的 WebView 与已启用能力。仅改普通界面不要求重复所有原生发行测试；本次应验证但缺失的层保持明确未验证，不以不适用掩盖缺口。

生产能力细化：退出与多窗口见 [生命周期](desktop-lifecycle.md)，持久化/迁移见 [存储](storage-and-migrations.md)，错误/日志见 [可观测性](errors-and-observability.md)，登录和持久化远端修改分别见 [会话](identity-and-sessions.md) 与 [同步](offline-and-sync.md)。

高风险原生/外部输入评审同时读取 [安全设计](security-and-threat-modeling.md)；构建/运行配置及秘密见 [配置治理](configuration-and-secrets.md)，完整验证策略见 [测试策略](testing-strategy.md)。
