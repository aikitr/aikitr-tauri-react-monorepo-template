# 07 身份、会话与授权

适用：存在登录、账户/租户切换或受授权远端数据的产品。auth domain 定义会话状态与策略，平台适配器实现凭据/认证协议，Rust/后端拥有可信校验，应用注入客户端。未提供认证时本章不触发预装 AuthProvider 或认证服务。

## AUTH-BOUNDARY · 状态与信任边界

- **默认**明确 `initializing / signed-out / authenticating / signed-in / refreshing / expired` 等实际需要的状态与转移，身份快照至少表达稳定主体和工作区/租户范围。多个布尔值不能制造“已退出但仍有可用会话”等隐含状态。
- **必须**把凭据与 UI 可读身份分开。组件可获得安全的用户/能力快照，不能读取 refresh token；token 只在传输/认证边界使用，禁止放入 URL、query key、普通 store 持久化和日志。
- **必须**由可信 Rust/后端验证实际身份和资源权限。前端隐藏按钮、缓存的 role、窗口 label 和 capability 不能代替业务授权；window capability 与用户授权分别成立。
- **Web 使用 cookie 会话时**明确 Secure/HttpOnly/SameSite、CSRF、origin 与后端配置；桌面 public client 不被假定为能保守内嵌 client secret 的服务端。共享 auth-core 不依赖某端专用的 cookie 或系统凭据 API。

## AUTH-OAUTH · 原生 OAuth/OIDC（采用时）

**必须**按协议和当前身份提供方能力使用授权码 + PKCE，授权在外部 user-agent（通常系统浏览器）完成；不在内嵌 WebView 收集第三方账号密码，也不把打包内 secret 当保密。校验 state、已注册 redirect URI、请求时效与一次性回调；采用 OIDC 时校验 nonce、issuer/audience 与所需签名，由可靠库承担相应校验。

deep link/loopback 回调经平台层与发起的登录事务匹配；冷启动、取消、重复或过期回调有明确结果。注册 URL scheme 本身不能证明来源可信。具体 PKCE、redirect 与 refresh 防重放策略按 RFC/提供方实现核实，不自造认证协议。

## AUTH-REFRESH · 刷新协调与错误

- **默认**同一会话的刷新单飞：同一时间只有一个权威协调者发请求，其余请求等待同一结果。多桌面窗口默认由原生认证服务/actor 协调；一个窗口内 JS mutex 不能覆盖其他窗口或进程。
- **必须**正确保存 refresh rotation 后的新凭据和会话 revision，旧刷新结果不能覆盖新会话。public-client refresh 防重放按提供方使用 rotation 或 sender-constrained 等支持方案，不能只无限延长本地有效期。
- **必须**为刷新定义截止、失败分类和重试上限；网络暂时失败不自动等同永久注销，明确失效/撤销才终止会话。接口 401 的重试遵守当前身份与幂等要求，禁止无限刷新循环或重放已执行的非幂等动作。
- **默认**时间判断容许适当偏移，设备睡眠/唤醒后重新确认有效性；服务端是最终授权事实，不用用户修改本地时钟延长授权。

## AUTH-LOGOUT · 退出、切换与迟到结果

1. **必须**先使旧会话代次失效并停止接收该身份的新操作，取消或隔离在途请求、后台任务、订阅和离线队列。
2. 清理身份范围的 Query 缓存、临时数据及按策略应删除的持久化信息；清除 token 并广播安全的会话变化，不广播凭据。
3. 身份切换前后的请求/任务携带稳定主体、租户与 session generation；迟到返回只能更新匹配的身份范围，不能写入新用户状态。
4. **按产品协议**调用撤销或服务端注销；离线/撤销失败时仍能本地退出，明确服务端撤销状态，不能声称已撤销所有设备。

退出后旧用户的队列不使用新用户 token 执行。是否保留旧用户离线草稿/数据由产品明确，存储隔离与再次访问策略一致；没有通过明确授权/恢复流程的后台工作不得继续。

## AUTH-ACCEPT · 验收证据

覆盖登录取消/过期/重复回调、并发 401 和多窗口刷新、rotation 持久化失败、退出发生在刷新/请求中、账户/租户切换、离线退出、休眠恢复、后端权限拒绝。验证无凭据进入 UI、日志或产物，旧请求/队列不能影响新身份。OAuth 依据见 [资料来源](sources.md)，持久化与同步分别见对应章节。

秘密获取/轮换与环境切换见 [配置与密钥](configuration-and-secrets.md)；账户数据删除与受限保留见 [数据生命周期](privacy-and-data-lifecycle.md)，不等同于退出会话。
