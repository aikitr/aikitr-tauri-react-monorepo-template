import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { createApiClient } from "./index";

function waitForAbort(_input: unknown, init?: RequestInit): Promise<Response> {
  return new Promise((_resolve, reject) => {
    const signal = init?.signal;
    if (!signal) throw new Error("Expected an AbortSignal");
    if (signal.aborted) reject(signal.reason);
    else
      signal.addEventListener("abort", () => reject(signal.reason), {
        once: true,
      });
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("API request boundaries", () => {
  it("parses and transforms a response using a Zod schema", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response('{"count":"42"}')),
    );
    const api = createApiClient({ baseUrl: "https://api.example.test" });
    const schema = z.object({ count: z.string().transform(Number) });
    await expect(api.get("/count", { schema })).resolves.toEqual({ count: 42 });
  });

  it("reports invalid response data once as VALIDATION", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response('{"count":"invalid"}')),
    );
    const onError = vi.fn();
    const api = createApiClient({
      baseUrl: "https://api.example.test",
      onError,
    });
    await expect(
      api.get("/count", { schema: z.object({ count: z.number() }) }),
    ).rejects.toMatchObject({ code: "VALIDATION" });
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it("reports an HTTP error once", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("{}", { status: 500 })),
    );
    const onError = vi.fn();
    const api = createApiClient({
      baseUrl: "https://api.example.test",
      onError,
    });
    await expect(api.get("/failure")).rejects.toMatchObject({
      code: "UNKNOWN",
    });
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it("does not send a request when the signal is already aborted", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}"));
    vi.stubGlobal("fetch", fetchMock);
    const controller = new AbortController();
    controller.abort(new Error("User cancelled"));
    const onError = vi.fn();
    const api = createApiClient({
      baseUrl: "https://api.example.test",
      onError,
    });
    await expect(
      api.get("/cancelled", { signal: controller.signal }),
    ).rejects.toMatchObject({ code: "CANCELLED" });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it("maps a timeout to TIMEOUT and clears timers", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn(waitForAbort));
    const onError = vi.fn();
    const api = createApiClient({
      baseUrl: "https://api.example.test",
      onError,
    });
    const result = api
      .get("/slow", { timeoutMs: 100 })
      .catch((error: unknown) => error);
    await vi.advanceTimersByTimeAsync(100);
    expect(await result).toMatchObject({ code: "TIMEOUT" });
    expect(onError).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("maps in-flight cancellation with a custom reason to CANCELLED", async () => {
    vi.stubGlobal("fetch", vi.fn(waitForAbort));
    const controller = new AbortController();
    const api = createApiClient({ baseUrl: "https://api.example.test" });
    const assertion = expect(
      api.get("/cancelled", { signal: controller.signal }),
    ).rejects.toMatchObject({ code: "CANCELLED" });
    controller.abort(new Error("Closed view"));
    await assertion;
  });

  it("cleans the timeout and abort listener after success", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response('{"ok":true}')),
    );
    const controller = new AbortController();
    const removeListener = vi.spyOn(controller.signal, "removeEventListener");
    const api = createApiClient({ baseUrl: "https://api.example.test" });
    await expect(
      api.get("/success", { signal: controller.signal, timeoutMs: 100 }),
    ).resolves.toEqual({ ok: true });
    expect(removeListener).toHaveBeenCalledWith("abort", expect.any(Function));
    expect(vi.getTimerCount()).toBe(0);
  });

  it("reports a network error once", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("Failed to fetch")),
    );
    const onError = vi.fn();
    const api = createApiClient({
      baseUrl: "https://api.example.test",
      onError,
    });
    await expect(api.get("/offline")).rejects.toMatchObject({
      code: "NETWORK",
    });
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it("supports empty responses and existing generic calls", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 204 })),
    );
    const api = createApiClient({ baseUrl: "https://api.example.test" });
    await expect(api.delete<null>("/item")).resolves.toBeNull();
  });
});
