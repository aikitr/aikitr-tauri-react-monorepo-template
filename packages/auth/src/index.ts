/**
 * 用户认证抽象层
 *
 * 规范：
 *   - feature/auth 只依赖本包导出的 AuthProvider / useAuth / authService
 *   - 登录方式（密码 / OAuth / SSO）通过 AuthBackend 策略切换，业务代码无感知
 *   - Access Token 仅保存在内存；Refresh Token / 持久会话交给 Secure Storage
 *   - 禁止任何组件直接读写 localStorage / sessionStorage
 */

import type {
  AppErrorShape,
  AuthSession,
  Credentials,
  User,
} from "@aikitr-desktop/types";
import type { ApiClient } from "@aikitr-desktop/api";
import { AppError } from "@aikitr-desktop/utils";

// ─────────────────────────────────────────────────────────
// Backend 接口：可替换为不同登录实现
// ─────────────────────────────────────────────────────────

export interface AuthBackend {
  login(credentials: Credentials): Promise<AuthSession>;
  logout(): Promise<void>;
  /** 刷新会话，返回 null 表示刷新失败（需重新登录） */
  refresh?(): Promise<AuthSession | null>;
  me?(): Promise<User>;
}

// ─────────────────────────────────────────────────────────
// 默认后端：走 HTTP API
// ─────────────────────────────────────────────────────────

export class HttpAuthBackend implements AuthBackend {
  constructor(
    private readonly api: ApiClient,
    private readonly endpoints: {
      login: string;
      logout: string;
      me: string;
      refresh?: string;
    } = {
      login: "/auth/login",
      logout: "/auth/logout",
      me: "/auth/me",
    },
  ) {}

  public async login(credentials: Credentials): Promise<AuthSession> {
    return this.api.post<AuthSession>(this.endpoints.login, {
      body: credentials,
      timeoutMs: 15_000,
    });
  }

  public async logout(): Promise<void> {
    try {
      await this.api.post(this.endpoints.logout, { timeoutMs: 5_000 });
    } catch {
      // 网络失败也继续完成本地登出流程
    }
  }

  public async me(): Promise<User> {
    return this.api.get<User>(this.endpoints.me, { timeoutMs: 10_000 });
  }

  public async refresh(): Promise<AuthSession | null> {
    if (!this.endpoints.refresh) return null;
    try {
      return await this.api.post<AuthSession>(this.endpoints.refresh, {
        timeoutMs: 10_000,
      });
    } catch (e) {
      const err = AppError.fromUnknown(e);
      if (err.code === "UNAUTHORIZED" || err.code === "FORBIDDEN") return null;
      throw e;
    }
  }
}

// ─────────────────────────────────────────────────────────
// 无依赖后端（离线 / Mock / 开发用）
// ─────────────────────────────────────────────────────────

export class MockAuthBackend implements AuthBackend {
  constructor(private readonly latencyMs = 300) {}

  public async login(credentials: Credentials): Promise<AuthSession> {
    await new Promise((r) => setTimeout(r, this.latencyMs));
    if (credentials.email !== "demo@aikitr.dev" || credentials.password !== "demo123") {
      throw new AppError(
        "UNAUTHORIZED" satisfies AppErrorShape["code"],
        "Invalid credentials. Try demo@aikitr.dev / demo123",
      );
    }
    return fakeSessionFor(credentials.email);
  }

  public async logout(): Promise<void> {
    await new Promise((r) => setTimeout(r, this.latencyMs / 2));
  }
}

function fakeSessionFor(email: string): AuthSession {
  const now = Date.now();
  return {
    accessToken: "mock.access.token",
    expiresAt: now + 1000 * 60 * 60 * 8, // 8h
    user: {
      id: "user_01HFZTKT",
      createdAt: new Date(now - 1000 * 60 * 60 * 24 * 30).toISOString(),
      updatedAt: new Date(now).toISOString(),
      email,
      name: "Demo User",
      avatarUrl: undefined,
      role: "admin",
      isActive: true,
    },
  };
}
