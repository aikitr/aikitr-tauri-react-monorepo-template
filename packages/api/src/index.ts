/**
 * 通用 HTTP API Client 封装
 *
 * 规范：
 *   - 组件 NEVER 直接 import fetch/invoke
 *   - 所有远程请求统一走这里创建的 client
 *   - 关键响应通过 schema.parse（如 Zod schema）进行运行时校验
 */

import type { AppErrorShape } from "@aikitr-desktop/types";
import { AppError, isNonEmptyString } from "@aikitr-desktop/utils";

export interface ResponseSchema<T> {
  parse(data: unknown): T;
}

export type RequestInitLike<T = unknown> = Omit<
  RequestInit,
  "headers" | "body"
> & {
  headers?: Record<string, string>;
  body?: unknown;
  signal?: AbortSignal;
  timeoutMs?: number;
  /** 传入 Zod 或其他同步响应解析器；未传入时保持现有调用行为。 */
  schema?: ResponseSchema<T>;
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
  get<T = unknown>(path: string, init?: RequestInitLike<T>): Promise<T>;
  post<T = unknown>(path: string, init?: RequestInitLike<T>): Promise<T>;
  put<T = unknown>(path: string, init?: RequestInitLike<T>): Promise<T>;
  patch<T = unknown>(path: string, init?: RequestInitLike<T>): Promise<T>;
  delete<T = unknown>(path: string, init?: RequestInitLike<T>): Promise<T>;
}

export function createApiClient(config: ApiClientConfig): ApiClient {
  if (!isNonEmptyString(config.baseUrl)) {
    throw new AppError("VALIDATION", "ApiClient baseUrl is required.");
  }

  const request = async <T>(
    path: string,
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
    init: RequestInitLike<T> = {},
  ): Promise<T> => {
    const url = path.startsWith("http")
      ? path
      : `${config.baseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;

    const {
      headers: requestHeaders,
      body,
      signal: userSignal,
      timeoutMs,
      schema,
      ...fetchOptions
    } = init;
    const headers: Record<string, string> = {
      Accept: "application/json",
      ...requestHeaders,
    };
    if (!("Content-Type" in headers) && body !== undefined) {
      headers["Content-Type"] = "application/json";
    }
    const token = config.getToken?.();
    if (token) headers.Authorization = `Bearer ${token}`;

    let timer: ReturnType<typeof setTimeout> | null = null;
    let abortCode: "TIMEOUT" | "CANCELLED" | undefined;
    const abortCtl = new AbortController();
    const abort = (code: "TIMEOUT" | "CANCELLED", reason: unknown) => {
      // The first abort wins, regardless of the caller's reason type.
      if (abortCtl.signal.aborted) return;
      abortCode = code;
      abortCtl.abort(reason);
    };
    const onUserAbort = () => abort("CANCELLED", userSignal?.reason);

    try {
      userSignal?.addEventListener("abort", onUserAbort, { once: true });
      if (userSignal?.aborted) onUserAbort();
      if (abortCtl.signal.aborted) {
        throw new AppError("CANCELLED", "Request cancelled.");
      }
      if (timeoutMs && timeoutMs > 0) {
        timer = setTimeout(
          () =>
            abort(
              "TIMEOUT",
              new DOMException("Request timed out.", "TimeoutError"),
            ),
          timeoutMs,
        );
      }

      const res = await fetch(url, {
        ...fetchOptions,
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: abortCtl.signal,
      });
      const text = await res.text();
      const data: unknown = text.length === 0 ? null : safeJSONParse(text);

      if (!res.ok) {
        const shape = asErrorShape(data);
        throw new AppError(
          mapStatusToCode(res.status, shape?.code),
          shape?.message ?? res.statusText,
          shape?.details,
        );
      }
      if (schema) {
        try {
          return schema.parse(data);
        } catch (cause) {
          throw new AppError(
            "VALIDATION",
            "Response validation failed.",
            undefined,
            { cause },
          );
        }
      }
      return data as T;
    } catch (cause) {
      const err = abortCode
        ? new AppError(
            abortCode,
            abortCode === "TIMEOUT"
              ? "Request timed out."
              : "Request cancelled.",
            undefined,
            { cause },
          )
        : cause instanceof AppError
          ? cause
          : cause instanceof TypeError
            ? new AppError("NETWORK", cause.message, undefined, { cause })
            : AppError.fromUnknown(cause);
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
  if (typeof obj.code !== "string" || typeof obj.message !== "string")
    return null;
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
