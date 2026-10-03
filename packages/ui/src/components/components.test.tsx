import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button, buttonVariants } from "./button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "./dialog";
import { UiButton } from "../button";

describe("shared accessible components", () => {
  it("supports keyboard activation and respects disabled buttons", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(
      <>
        <Button onClick={onClick}>Run</Button>
        <Button onClick={onClick} disabled>
          Disabled
        </Button>
      </>,
    );
    await user.tab();
    expect(screen.getByRole("button", { name: "Run" })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(onClick).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole("button", { name: "Disabled" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("preserves link semantics with buttonVariants", () => {
    render(
      <a href="/settings" className={buttonVariants({ variant: "outline" })}>
        Settings
      </a>,
    );
    expect(screen.getByRole("link", { name: "Settings" })).toHaveAttribute(
      "href",
      "/settings",
    );
  });

  it("retains the existing UiButton md size entry point", () => {
    render(<UiButton size="md">Compatible</UiButton>);
    expect(screen.getByRole("button", { name: "Compatible" })).toHaveAttribute(
      "data-slot",
      "button",
    );
  });

  it("opens a dialog, closes with Escape and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    render(
      <Dialog>
        <DialogTrigger render={<Button />}>Open</DialogTrigger>
        <DialogContent>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Change preferences.</DialogDescription>
        </DialogContent>
      </Dialog>,
    );
    const trigger = screen.getByRole("button", { name: "Open" });
    await user.click(trigger);
    expect(
      await screen.findByRole("dialog", { name: "Settings" }),
    ).toBeInTheDocument();
    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    await waitFor(() => expect(trigger).toHaveFocus());
  });
});
