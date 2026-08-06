import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";

function App() {
  const [greeting, setGreeting] = useState<string>("");

  async function handleGreet() {
    console.info("[App] handleGreet 开始调用 Rust greet()");

    try {
      const result = await invoke<string>("greet", { name: "Trae" });
      console.info("[App] Rust greet() 返回:", result);
      setGreeting(result);
    } catch (err) {
      console.error("[App] Rust greet() 调用失败:", err);
      setGreeting(`调用失败: ${err}`);
    }
  }

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center gap-6 bg-background text-foreground">
      <h1 className="text-4xl font-bold tracking-tight">aikitr-desktop</h1>
      <p className="text-lg text-muted-foreground">
        Tauri v2 + React 19 + Tailwind CSS v4
      </p>

      <div className="flex flex-col items-center gap-3">
        <button
          onClick={handleGreet}
          className="rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Call Rust greet()
        </button>

        {greeting && (
          <p className="rounded-md border border-border bg-muted px-4 py-2 text-sm text-foreground">
            {greeting}
          </p>
        )}
      </div>

      <div className="mt-4 flex gap-3">
        <span className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground">
          Ready
        </span>
      </div>
    </div>
  );
}

export default App;
