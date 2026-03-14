import { useState } from "react";
import { useKeyboard, useRenderer } from "@opentui/react";
import { Database } from "bun:sqlite";
import { Welcome } from "./components/welcome";
import { MainView } from "./components/main-view";

export function App({ initialPath }: { initialPath?: string }) {
  const renderer = useRenderer();
  const [view, setView] = useState<"welcome" | "main">(
    initialPath ? "main" : "welcome"
  );
  const [dbPath, setDbPath] = useState(initialPath || "");
  const [db, setDb] = useState<Database | null>(() => {
    if (initialPath) {
      try {
        return new Database(initialPath);
      } catch {
        return null;
      }
    }
    return null;
  });

  const handleConnect = (path: string, database: Database) => {
    setDbPath(path);
    setDb(database);
    setView("main");
  };

  const handleDisconnect = () => {
    if (db) {
      db.close();
    }
    setDb(null);
    setDbPath("");
    setView("welcome");
  };

  if (view === "welcome" || !db) {
    return <Welcome onConnect={handleConnect} initialPath={dbPath} />;
  }

  return (
    <MainView
      db={db}
      dbPath={dbPath}
      onDisconnect={handleDisconnect}
    />
  );
}
