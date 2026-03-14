import { useState } from "react";
import { useKeyboard, useRenderer } from "@opentui/react";
import { Database } from "bun:sqlite";
import { existsSync, readdirSync } from "fs";
import { resolve } from "path";

const THEME = {
  bg: "#1a1b26",
  panelBg: "#1f2335",
  accent: "#7aa2f7",
  text: "#c0caf5",
  dim: "#565f89",
  error: "#f7768e",
};

interface WelcomeProps {
  onConnect: (path: string, db: Database) => void;
  initialPath?: string;
}

function findLocalDatabases(): string[] {
  try {
    return readdirSync(process.cwd())
      .filter((f) => /\.(db|sqlite|sqlite3)$/i.test(f))
      .sort();
  } catch {
    return [];
  }
}

export function Welcome({ onConnect, initialPath }: WelcomeProps) {
  const renderer = useRenderer();
  const [path, setPath] = useState(initialPath || "");
  const [error, setError] = useState("");
  const [localDbs] = useState(findLocalDatabases);
  const [zone, setZone] = useState<"input" | "list">("input");

  useKeyboard((key) => {
    if (key.ctrl && key.name === "c") { renderer.destroy(); return; }
    if (key.name === "tab" && localDbs.length > 0) {
      setZone((z) => (z === "input" ? "list" : "input"));
      return;
    }
    if (zone === "input" && key.name === "enter") {
      tryConnect(path.trim());
    }
  });

  const tryConnect = (filePath: string) => {
    const trimmed = filePath.trim();
    if (!trimmed) { setError("Please enter a database path"); return; }
    const resolved = resolve(trimmed);
    try {
      const db = new Database(resolved);
      setError("");
      onConnect(resolved, db);
    } catch (e: any) {
      setError(e.message ?? String(e));
    }
  };

  const dbOptions = localDbs.map((f) => ({
    name: f,
    description: "",
    value: f,
  }));

  return (
    <box
      flexGrow={1}
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      backgroundColor={THEME.bg}
    >
      <box flexDirection="column" alignItems="center" gap={1}>
        <ascii-font font="tiny" text="sqlpeekk" color={THEME.accent} />
        <text fg={THEME.dim}>A terminal UI for exploring SQLite databases</text>

        <box height={1} />

        <box flexDirection="column" gap={1} width={60}>
          <box
            border borderStyle="rounded"
            borderColor={zone === "input" ? THEME.accent : THEME.dim}
            paddingX={1}
            title=" Database Path "
            titleAlignment="left"
            onMouseDown={() => setZone("input")}
          >
            <input
              value={path}
              onChange={setPath}
              placeholder="Enter path to .sqlite or .db file..."
              focused={zone === "input"}
              backgroundColor={THEME.panelBg}
              textColor={THEME.text}
              cursorColor={THEME.accent}
              placeholderColor={THEME.dim}
              width={56}
            />
          </box>

          {localDbs.length > 0 && (
            <box
              border borderStyle="rounded"
              borderColor={zone === "list" ? THEME.accent : THEME.dim}
              title={` ${localDbs.length} database${localDbs.length !== 1 ? "s" : ""} in current directory `}
              titleAlignment="left"
              flexDirection="column"
              onMouseDown={() => setZone("list")}
            >
              <select
                options={dbOptions}
                focused={zone === "list"}
                onSelect={(_i, opt) => opt && tryConnect(opt.value as string)}
                selectedBackgroundColor="#292e42"
                selectedTextColor={THEME.accent}
                height={Math.min(localDbs.length, 6)}
                showScrollIndicator
              />
            </box>
          )}

          {error ? (
            <text fg={THEME.error}> {error}</text>
          ) : (
            <text fg={THEME.dim}>
              {" "}
              <span fg={THEME.accent}>Enter</span> to connect
              {localDbs.length > 0 && (
                <>{"  "}<span fg={THEME.accent}>Tab</span> to switch</>
              )}
              {"  "}<span fg={THEME.dim}>Ctrl+C to quit</span>
            </text>
          )}
        </box>
      </box>
    </box>
  );
}
