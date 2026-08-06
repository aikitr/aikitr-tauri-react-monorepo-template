/**
 * 共享 TypeScript 类型定义
 *
 * 原则：
 * 1. 所有跨包共享的实体类型、DTO、枚举集中在此
 * 2. 禁止引入任何实现代码或运行时依赖，保持纯类型
 * 3. 未知结构用 unknown + 类型收窄，禁止 any
 */

// ─────────────────────────────────────────────────────────
// 基础实体接口
// ─────────────────────────────────────────────────────────

/** 所有可持久化实体的公共基类字段 */
export interface BaseEntity {
  /** 全局唯一 ID（UUID v4 / NanoID） */
  readonly id: string;
  /** 创建时间（ISO 8601） */
  readonly createdAt: string;
  /** 更新时间（ISO 8601） */
  readonly updatedAt: string;
}

// ─────────────────────────────────────────────────────────
// 用户 / 认证
// ─────────────────────────────────────────────────────────

/** 应用用户（不包含敏感凭证） */
export interface User extends BaseEntity {
  readonly email: string;
  readonly name: string;
  /** 头像 URL（可空） */
  readonly avatarUrl?: string | undefined;
  readonly role: UserRole;
  /** 用户是否已激活（邮箱验证完成） */
  readonly isActive: boolean;
}

/** 用户角色枚举（字符串字面量联合） */
export type UserRole = "owner" | "admin" | "member" | "viewer";

/** 登录凭证（前端仅内存使用，禁止落盘明文） */
export interface Credentials {
  readonly email: string;
  readonly password: string;
}

/** 成功登录返回的会话信息 */
export interface AuthSession {
  readonly accessToken: string;
  /** 刷新 token（如使用），存 Secure Storage，**永不**落 localStorage */
  readonly refreshToken?: string | undefined;
  readonly user: User;
  /** 过期时间戳（毫秒） */
  readonly expiresAt: number;
}

// ─────────────────────────────────────────────────────────
// 错误 / 结果
// ─────────────────────────────────────────────────────────

/** 统一的 API / Invoke 返回错误结构 */
export interface AppErrorShape {
  /** 机器可读错误码 */
  readonly code: AppErrorCode;
  /** 面向开发者的可读消息 */
  readonly message: string;
  /** 可选的上下文（字段名、参数名等） */
  readonly details?: Readonly<Record<string, unknown>> | undefined;
}

/** 应用错误码清单（后续扩展） */
export type AppErrorCode =
  | "UNKNOWN"
  | "NETWORK"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION"
  | "TIMEOUT"
  | "CANCELLED"
  | "FILESYSTEM"
  | "WINDOW"
  | "PERMISSION";

/** Result 模式 — 替代 throw，让调用方必须处理失败分支 */
export type Result<T, E extends AppErrorShape = AppErrorShape> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

// ─────────────────────────────────────────────────────────
// 分页 / 查询
// ─────────────────────────────────────────────────────────

/** 分页查询参数 */
export interface PaginationParams {
  readonly page: number;
  readonly pageSize: number;
  readonly sortBy?: string | undefined;
  readonly sortOrder?: "asc" | "desc" | undefined;
}

/** 分页结果 */
export interface PageResult<T> {
  readonly items: readonly T[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
}
