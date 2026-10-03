import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { mockIPC } from "@tauri-apps/api/mocks";
import { describe, expect, it, vi } from "vitest";
import App from "./App";

describe("Rust greeting", () => {
  it("passes the entered name through official Tauri IPC mocking", async () => {
    const ipc = vi.fn<Parameters<typeof mockIPC>[0]>((command, payload) => {
      if (command !== "greet")
        throw new Error(`Unexpected command: ${command}`);
      if (
        !payload ||
        !("name" in payload) ||
        typeof payload.name !== "string"
      ) {
        throw new Error("Expected a name payload");
      }
      return `Hello, ${payload.name}!`;
    });
    mockIPC(ipc);
    const user = userEvent.setup();
    render(<App />);
    await user.clear(screen.getByLabelText("姓名"));
    await user.type(screen.getByLabelText("姓名"), "Chen");
    await user.click(screen.getByRole("button", { name: "Call Rust greet()" }));
    expect(await screen.findByText("Hello, Chen!")).toBeInTheDocument();
    expect(ipc).toHaveBeenCalledWith("greet", { name: "Chen" });
  });

  it("displays an IPC failure and restores the button", async () => {
    mockIPC(() => {
      throw new Error("Backend unavailable");
    });
    render(<App />);
    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Call Rust greet()" }));
    expect(
      await screen.findByText(/调用失败.*Backend unavailable/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Call Rust greet()" }),
    ).toBeEnabled();
  });
});
