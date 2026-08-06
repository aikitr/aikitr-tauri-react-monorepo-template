/** 延迟 ms 毫秒 */
export function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

/**
 * 防抖：在最后一次调用后 wait ms 才实际执行
 */
export function debounce<T extends (...args: never[]) => void>(
  fn: T,
  wait = 200,
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return function debounced(...args: Parameters<T>) {
    if (timer !== null) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

/**
 * 节流：至少每 wait ms 才执行一次（头调用触发）
 */
export function throttle<T extends (...args: never[]) => void>(
  fn: T,
  wait = 100,
): (...args: Parameters<T>) => void {
  let last = 0;
  return function throttled(...args: Parameters<T>) {
    const now = Date.now();
    if (now - last >= wait) {
      last = now;
      fn(...args);
    }
  };
}
