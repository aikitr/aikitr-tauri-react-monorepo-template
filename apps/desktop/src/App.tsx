import { useState } from "react";
import { Button } from "@aikitr-desktop/ui/components/button";
import { Card, CardContent } from "@aikitr-desktop/ui/components/card";
import { Input } from "@aikitr-desktop/ui/components/input";
import { Label } from "@aikitr-desktop/ui/components/label";
import { greet } from "./lib/services/greeting";

function App() {
  const [name, setName] = useState("Trae");
  const [greeting, setGreeting] = useState("");
  const [pending, setPending] = useState(false);

  async function handleGreet() {
    setPending(true);
    try {
      setGreeting(await greet(name));
    } catch (err) {
      setGreeting(`调用失败: ${err}`);
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="flex h-screen w-screen flex-col items-center justify-center gap-6 bg-background p-6 text-foreground">
      <h1 className="text-4xl font-bold tracking-tight">aikitr-desktop</h1>
      <p className="text-lg text-muted-foreground">
        Tauri v2 + React 19 + Tailwind CSS v4
      </p>
      <Card className="w-full max-w-md">
        <CardContent>
          <form
            className="flex flex-col gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              void handleGreet();
            }}
          >
            <Label htmlFor="greet-name">姓名</Label>
            <Input
              id="greet-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={pending}
            />
            <Button type="submit" disabled={pending}>
              {pending ? "调用中…" : "Call Rust greet()"}
            </Button>
            <p
              role="status"
              aria-live="polite"
              className="text-sm text-muted-foreground"
            >
              {greeting || "Ready"}
            </p>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

export default App;
