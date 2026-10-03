import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = fileURLToPath(new URL("..", import.meta.url));
interface Task {
  taskId: string;
  directory: string;
  command: string;
  inputs: Record<string, string>;
}
const dryRun = JSON.parse(
  execFileSync(
    process.execPath,
    [
      resolve(root, "node_modules/turbo/bin/turbo"),
      "run",
      "test",
      "build:frontend",
      "lint",
      "type-check",
      "--dry=json",
    ],
    { cwd: root, encoding: "utf8" },
  ),
) as { tasks: Task[] };
const tasks = dryRun.tasks.filter((task) => task.command !== "<NONEXISTENT>");

describe("build cache boundaries", () => {
  it("excludes generated logs and dependency artifacts from task inputs", () => {
    expect(tasks.length).toBeGreaterThan(0);
    for (const task of tasks) {
      expect(
        Object.keys(task.inputs).filter((path) =>
          /(?:^|[/\\])(?:node_modules|\.turbo|dist|coverage)(?:[/\\]|$)/.test(
            path,
          ),
        ),
        task.taskId,
      ).toEqual([]);
    }
  });

  it("hashes shared test configuration and DOM setup for every test task", () => {
    const testTasks = tasks.filter((task) => task.taskId.endsWith("#test"));
    expect(testTasks.length).toBeGreaterThan(0);
    for (const task of testTasks) {
      const paths = Object.keys(task.inputs).map((path) =>
        resolve(root, task.directory, path),
      );
      expect(paths, task.taskId).toContain(resolve(root, "vitest.config.ts"));
      expect(paths, task.taskId).toContain(resolve(root, "tests/setup-dom.ts"));
    }
  });
});
