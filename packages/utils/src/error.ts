import type { AppErrorCode, AppErrorShape, Result } from "@aikitr-desktop/types";

/**
 * 统一应用错误
 *
 * - 前端：在 service 层用 throw new AppError()，TanStack Query 的 onError 接
 * - Rust 端：Result<T, AppError> serialize 后返回同结构
 * - 禁止组件内 console.log 错误，统一走错误边界或全局上报
 */
export class AppError extends Error implements AppErrorShape {
  public readonly code: AppErrorCode;
  public readonly details?: Readonly<Record<string, unknown>>;

  constructor(
    code: AppErrorCode = "UNKNOWN",
    message: string = "Unexpected error occurred.",
    details?: Readonly<Record<string, unknown>>,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "AppError";
    this.code = code;
    this.details = details;
    // 保持错误堆栈可读
    Object.setPrototypeOf(this, AppError.prototype);
  }

  /** 序列化为传给 UI / 上报的 plain 对象 */
  public toJSON(): AppErrorShape {
    return { code: this.code, message: this.message, details: this.details };
  }

  public static fromUnknown(err: unknown): AppError {
    if (err instanceof AppError) return err;
    if (err instanceof Error) return new AppError("UNKNOWN", err.message);
    return new AppError("UNKNOWN", String(err));
  }
}

// ─────────────────────────────────────────────────────────
// Result 模式辅助函数（替代抛错的显式处理方案）
// ─────────────────────────────────────────────────────────

export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value } as Result<T, never>;
}

export function err<E extends AppErrorShape>(error: E): Result<never, E> {
  return { ok: false, error } as Result<never, E>;
}

/** 便捷工厂：把 code+message 包成失败 Result */
export function createResult(): {
  ok: <T>(v: T) => Result<T, never>;
  err: (
    code: AppErrorCode,
    message: string,
    details?: Readonly<Record<string, unknown>>,
  ) => Result<never, AppErrorShape>;
} {
  return {
    ok,
    err: (code, message, details) => err({ code, message, details }),
  };
}
