import type { AppErrorCode } from "@aikitr-desktop/types";

export function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

/** RFC 4122 UUID v4 宽松校验 */
export function isUUID(v: unknown): v is string {
  return (
    typeof v === "string" &&
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(v)
  );
}

/** 简化的邮箱格式校验（RFC 5322 子集，后端会再校验） */
export function isEmail(v: unknown): v is string {
  return (
    typeof v === "string" &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) &&
    v.length <= 254
  );
}

/** 可读化字节数：1536 → "1.5 KB" */
export function formatBytes(bytes: number, decimals = 1): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB", "PB"] as const;
  const i = Math.min(
    Math.floor(Math.log(bytes) / Math.log(k)),
    sizes.length - 1,
  );
  const scaled = bytes / Math.pow(k, i);
  return `${scaled.toFixed(decimals)} ${sizes[i]}`;
}

/** 校验失败的错误码映射：给 Zod refine 用 */
export function validationCodeFor(
  field: string,
  rule: string,
): `VALIDATION::${string}` {
  return `VALIDATION::${field}::${rule}` as `VALIDATION::${string}`;
}

/** 类型断言辅助：把 unknown 的错误码收窄为合法 AppErrorCode */
export function asAppErrorCode(v: unknown): AppErrorCode {
  const known = new Set<AppErrorCode>([
    "UNKNOWN", "NETWORK", "UNAUTHORIZED", "FORBIDDEN", "NOT_FOUND",
    "VALIDATION", "TIMEOUT", "CANCELLED", "FILESYSTEM", "WINDOW", "PERMISSION",
  ]);
  return known.has(v as AppErrorCode) ? (v as AppErrorCode) : "UNKNOWN";
}
