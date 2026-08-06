import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * 合并 Tailwind 类名：
 * 1) clsx 处理条件/数组/对象表达式
 * 2) tailwind-merge 解决冲突（如 `p-2 p-4` → `p-4`）
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
