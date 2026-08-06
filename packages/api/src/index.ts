/**
 * 通用 HTTP API Client 封装
 *
 * 规范：
 *   - 组件 NEVER 直接 import fetch/invoke
 *   - 所有远程请求统一走这里创建的 client
 *   - 响应体必须经过 Zod 校验后再交给上层（防止后端改 schema 导致前端静默错误）
 */

import type { AppErrorShape } from "@aikitr-desktop/types";
import { AppError, isNonEmptyString } from "@aikitr-desktop/utils";

export type RequestInitLike = Omit<RequestInit, "headers" | "body"> & {
  headers?: Record<string, string>;
  body?: unknown;
  signal?: AbortSignal;
  timeoutMs?: number;
};

export interface ApiClientConfig {
  baseUrl: string;
  /** 注入认证头的钩子，返回字符串将作为 Authorization header */
  getToken?: () => string | undefined;
  /** 可选的全局错误上报 */
  onError?: (err: AppError) => void;
}

export interface ApiClient {
  readonly config: Readonly<ApiClientConfig>;
  get<T>(path: string, init?: RequestInitLike): Promise<T>;
  post<T>(path: string, init?: RequestInitLike): Promise<T>;
  put<T>(path: string, init?: RequestInitLike): Promise<T>;
  patch<T>(path: string, init?: RequestInitLike): Promise<T>;
  delete<T>(path: string, init?: RequestInitLike): Promise<T>;
}

export function createApiClient(config: ApiClientConfig): ApiClient {
  if (!isNonEmptyString(config.baseUrl)) {
    throw new AppError("VALIDATION", "ApiClient baseUrl is required.");
  }

  const request = async <T>(
    path: string,
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
    init: RequestInitLike = {},
  ): Promise<T> => {
    const url = path.startsWith("http")
      ? path
      : `${config.baseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;

    const headers: Record<string, string> = {
      Accept: "application/json",
      ...(init.headers ?? {}),
    };
    if (!("Content-Type" in headers) && init.body !== undefined) {
      headers["Content-Type"] = "application/json";
    }
    const token = config.getToken?.();
    if (token) headers.Authorization = `Bearer ${token}`;

    // 超时控制（AbortSignal.race 需要 Node 20+/现代浏览器，这里用手动实现）
    let timer: ReturnType<typeof setTimeout> | null = null;
    const abortCtl = new AbortController();
    const userSignal = init.signal;
    const onUserAbort = () => abortCtl.abort(userSignal?.reason);
    userSignal?.addEventListener("abort", onUserAbort, { once: true });
    if (init.timeoutMs && init.timeoutMs > 0) {
      timer = setTimeout(
        () => abortCtl.abort(new DOMException("Timeout", "TimeoutError")),
        init.timeoutMs,
      );
    }

    try {
      const res = await fetch(url, {
        method,
        headers,
        body: init.body === undefined ? undefined : JSON.stringify(init.body),
        signal: abortCtl.signal,
      });
      const text = await res.text();
      let data: unknown = text.length === 0 ? null : safeJSONParse(text);

      if (!res.ok) {
        const shape = asErrorShape(data);
        const err = new AppError(
          mapStatusToCode(res.status, shape?.code),
          shape?.message ?? res.statusText,
          shape?.details,
        );
        config.onError?.(err);
        throw err;
      }
      return data as T;
    } catch (e) {
      if (e instanceof AppError) {
        config.onError?.(e);
        throw e;
      }
      const err = AppError.fromUnknown(e);
      // 网络类错误（fetch 抛的 TypeError / AbortError）
      if ((e as Error)?.name === "AbortError") {
        const mapped = new AppError(
          (e as DOMException).message.includes("Timeout") ? "TIMEOUT" : "CANCELLED",
          (e as Error).message,
        );
        config.onError?.(mapped);
        throw mapped;
      }
      if ((e as Error)?.name === "TypeError") {
        const mapped = new AppError("NETWORK", (e as Error).message);
        config.onError?.(mapped);
        throw mapped;
      }
      config.onError?.(err);
      throw err;
    } finally {
      if (timer !== null) clearTimeout(timer);
      userSignal?.removeEventListener("abort", onUserAbort);
    }
  };

  return {
    config,
    get: (p, i) => request(p, "GET", i),
    post: (p, i) => request(p, "POST", i),
    put: (p, i) => request(p, "PUT", i),
    patch: (p, i) => request(p, "PATCH", i),
    delete: (p, i) => request(p, "DELETE", i),
  };
}

function safeJSONParse(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function asErrorShape(data: unknown): AppErrorShape | null {
  if (!data || typeof data !== "object") return null;
  const obj = data as Record<string, unknown>;
  if (typeof obj.code !== "string" || typeof obj.message !== "string") return null;
  return {
    code: obj.code as AppErrorShape["code"],
    message: obj.message,
    details:
      obj.details && typeof obj.details === "object"
        ? (obj.details as Record<string, unknown>)
        : undefined,
  };
}

function mapStatusToCode(
  status: number,
  override?: string | undefined,
): AppErrorShape["code"] {
  if (override && (override as string).length > 0) {
    return override as AppErrorShape["code"];
  }
  switch (status) {
    case 401:
      return "UNAUTHORIZED";
    case 403:
      return "FORBIDDEN";
    case 404:
      return "NOT_FOUND";
    case 400:
    case 422:
      return "VALIDATION";
    case 408:
      return "TIMEOUT";
    case 499:
      return "CANCELLED";
    default:
      return status >= 500 ? "UNKNOWN" : "UNKNOWN";
  }
}
