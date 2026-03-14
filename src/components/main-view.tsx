import { useState, useRef, useCallback } from "react";
import { useKeyboard, useRenderer } from "@opentui/react";
import { Database } from "bun:sqlite";
import type { TextareaRenderable } from "@opentui/core";
import { executeQuery, listTables, exportToCsv, type QueryResult } from "../db";
import { TableList } from "./table-list";
import { QueryEditor } from "./query-editor";
import { ResultsTable } from "./results-table";
import { StatusBar } from "./status-bar";
import { SchemaPanel } from "./schema-panel";
import { HelpOverlay } from "./help-overlay";

const BG = "#1a1b26";
const MAX_HISTORY = 50;

type Panel = "tables" | "editor" | "results";

interface MainViewProps {
  db: Database;
  dbPath: string;
  onDisconnect: () => void;
}

export function MainView({ db, dbPath, onDisconnect }: MainViewProps) {
  const renderer = useRenderer();
  const editorRef = useRef<TextareaRenderable | null>(null);

  const [focusedPanel, setFocusedPanel] = useState<Panel>("tables");
  const [editorSeed, setEditorSeed] = useState(""); // drives initialValue updates
  const [result, setResult] = useState<QueryResult | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [sortCol, setSortCol] = useState<number | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [schemaTable, setSchemaTable] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [tableRefreshKey, setTableRefreshKey] = useState(0);
  const [statusMsg, setStatusMsg] = useState("");

  const flash = (msg: string) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(""), 2500);
  };

  const runQuery = useCallback((sql?: string) => {
    const q = (sql ?? editorRef.current?.plainText ?? "").trim();
    if (!q) return;
    const res = executeQuery(db, q);
    setResult(res);
    setSortCol(null);
    setSortAsc(true);
    setFocusedPanel("results");
    setHistory((prev) => {
      const deduped = prev.filter((h) => h !== q);
      return [q, ...deduped].slice(0, MAX_HISTORY);
    });
    setHistoryIndex(-1);
    if (!res.error && res.affectedRows !== undefined && res.affectedRows > 0) {
      flash(`${res.affectedRows} row${res.affectedRows !== 1 ? "s" : ""} affected`);
    }
  }, [db]);

  const handleExportCsv = useCallback(() => {
    if (!result || result.error || !result.columns.length) return;
    const csv = exportToCsv(result);
    const filename = `export_${Date.now()}.csv`;
    Bun.write(filename, csv);
    flash(`Exported ${result.rowCount} rows to ${filename}`);
  }, [result]);

  useKeyboard((key) => {
    if (showHelp) {
      if (key.name === "escape" || key.name === "?" || key.name === "q") setShowHelp(false);
      return;
    }
    if (schemaTable) {
      if (key.name === "escape" || key.name === "i") setSchemaTable(null);
      return;
    }

    // Always-on
    if (key.ctrl && key.name === "c") { renderer.destroy(); return; }
    if (key.ctrl && key.name === "d") { onDisconnect(); return; }

    // Run query from any panel — intercept before textarea swallows Ctrl+Enter
    if (key.ctrl && (key.name === "enter" || key.name === "return")) { runQuery(); return; }
    if (key.name === "f5") { runQuery(); return; }

    if (key.name === "f1" || key.name === "?") { setShowHelp(true); return; }

    // Tab cycles panels
    if (key.name === "tab") {
      setFocusedPanel((p) =>
        p === "tables" ? "editor" : p === "editor" ? "results" : "tables"
      );
      return;
    }

    // Editor mode: only Escape leaves
    if (focusedPanel === "editor") {
      if (key.name === "escape") setFocusedPanel("tables");
      return;
    }

    if (key.name === "escape" || key.name === "q") { renderer.destroy(); return; }

    // Query history via up/down — only from tables panel (results needs up/down for scrolling)
    if (focusedPanel === "tables") {
      if (key.name === "up" && history.length > 0) {
        const next = Math.min(historyIndex + 1, history.length - 1);
        const entry = history[next];
        if (entry !== undefined) {
          setHistoryIndex(next);
          setEditorSeed(entry);
          setFocusedPanel("editor");
        }
        return;
      }
      if (key.name === "down" && historyIndex >= 0) {
        const next = historyIndex - 1;
        if (next < 0) {
          setHistoryIndex(-1);
          setEditorSeed("");
        } else {
          const entry = history[next];
          if (entry !== undefined) {
            setHistoryIndex(next);
            setEditorSeed(entry);
          }
        }
        return;
      }
    }

    // Results shortcuts
    if (focusedPanel === "results" && result && !result.error) {
      if (key.name === "," || key.name === "<") {
        setSortCol((c) => (c !== null && c > 0 ? c - 1 : result.columns.length - 1));
        return;
      }
      if (key.name === "." || key.name === ">") {
        setSortCol((c) => (c !== null ? (c + 1) % result.columns.length : 0));
        return;
      }
      if (key.name === "s") { setSortAsc((a) => !a); return; }
      if (key.name === "e") { handleExportCsv(); return; }
    }

    // Tables shortcuts
    if (focusedPanel === "tables") {
      if (key.name === "r") { setTableRefreshKey((k) => k + 1); flash("Tables refreshed"); return; }
    }
  });

  const handleTableSelect = (tableName: string) => {
    const q = `SELECT * FROM "${tableName}" LIMIT 100`;
    setEditorSeed(q);
    runQuery(q);
  };

  return (
    <box flexGrow={1} flexDirection="column" backgroundColor={BG}>
      {showHelp && <HelpOverlay onClose={() => setShowHelp(false)} />}
      {schemaTable && (
        <SchemaPanel
          db={db}
          tableName={schemaTable}
          onClose={() => setSchemaTable(null)}
          onQuery={(q) => {
            setSchemaTable(null);
            setEditorSeed(q);
            setFocusedPanel("editor");
          }}
        />
      )}

      <box flexGrow={1} flexDirection="row">
        <TableList
          key={tableRefreshKey}
          db={db}
          focused={focusedPanel === "tables"}
          onTableSelect={handleTableSelect}
          onSchemaView={setSchemaTable}
          onFocus={() => setFocusedPanel("tables")}
        />
        <box flexGrow={1} flexDirection="column">
          <QueryEditor
            initialValue={editorSeed}
            focused={focusedPanel === "editor"}
            historyLength={history.length}
            editorRef={editorRef}
            onFocus={() => setFocusedPanel("editor")}
          />
          <ResultsTable
            result={result}
            focused={focusedPanel === "results"}
            sortCol={sortCol}
            sortAsc={sortAsc}
            onFocus={() => setFocusedPanel("results")}
          />
        </box>
      </box>

      <StatusBar
        dbPath={dbPath}
        tableCount={listTables(db).length}
        focusedPanel={focusedPanel}
        historyLength={history.length}
        statusMsg={statusMsg}
      />
    </box>
  );
}
