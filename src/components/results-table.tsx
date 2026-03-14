import type { QueryResult } from "../db";

const THEME = {
  panelBg: "#1f2335",
  accent: "#7aa2f7",
  border: "#414868",
  text: "#c0caf5",
  dim: "#565f89",
  error: "#f7768e",
  success: "#9ece6a",
  nullColor: "#bb9af7",
};

interface ResultsTableProps {
  result: QueryResult | null;
  focused: boolean;
  sortCol: number | null;
  sortAsc: boolean;
  onFocus: () => void;
}

function formatCell(value: any, width: number): string {
  if (value === null || value === undefined) return "NULL".padEnd(width);
  const str = String(value);
  return str.length > width ? str.slice(0, width - 1) + "…" : str.padEnd(width);
}

export function ResultsTable({ result, focused, sortCol, sortAsc, onFocus }: ResultsTableProps) {
  const borderColor = result?.error ? THEME.error : focused ? THEME.accent : THEME.border;
  const title = result?.error ? " Error " : " Results ";

  if (!result) {
    return (
      <box
        flexGrow={1} border borderStyle="rounded"
        borderColor={THEME.border} backgroundColor={THEME.panelBg}
        title=" Results " titleAlignment="center"
        alignItems="center" justifyContent="center"
        onMouseDown={onFocus}
      >
        <text fg={THEME.dim}>Run a query to see results</text>
      </box>
    );
  }

  if (result.error) {
    return (
      <box
        flexGrow={1} border borderStyle="rounded"
        borderColor={borderColor} backgroundColor={THEME.panelBg}
        title={title} titleAlignment="center"
        flexDirection="column" onMouseDown={onFocus}
      >
        <box padding={1} flexGrow={1}>
          <text fg={THEME.error}>{result.error}</text>
        </box>
        <box paddingX={1} paddingBottom={1}>
          <text fg={THEME.dim}>{result.time.toFixed(1)}ms</text>
        </box>
      </box>
    );
  }

  if (result.columns.length === 0) {
    return (
      <box
        flexGrow={1} border borderStyle="rounded"
        borderColor={borderColor} backgroundColor={THEME.panelBg}
        title={title} titleAlignment="center"
        flexDirection="column" onMouseDown={onFocus}
      >
        <box flexGrow={1} alignItems="center" justifyContent="center">
          <text fg={THEME.dim}>
            {result.affectedRows !== undefined
              ? `OK — ${result.affectedRows} row${result.affectedRows !== 1 ? "s" : ""} affected`
              : "No rows returned"}
          </text>
        </box>
        <box paddingX={1} paddingBottom={1}>
          <text fg={THEME.dim}>{result.time.toFixed(1)}ms</text>
        </box>
      </box>
    );
  }

  // Sort rows if needed
  let rows = result.rows;
  if (sortCol !== null) {
    const col = sortCol;
    rows = [...result.rows].sort((a, b) => {
      const av = a[col] ?? "";
      const bv = b[col] ?? "";
      const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
      return sortAsc ? cmp : -cmp;
    });
  }

  // Column widths
  const colWidths = result.columns.map((col, i) => {
    let max = col.length + (sortCol === i ? 2 : 0);
    for (const row of rows.slice(0, 200)) {
      const len = String(row[i] ?? "NULL").length;
      if (len > max) max = len;
    }
    return Math.min(Math.max(max, 4), 30);
  });

  const headerLine = result.columns
    .map((col, i) => {
      const indicator = sortCol === i ? (sortAsc ? "↑" : "↓") : "";
      return formatCell(col + indicator, colWidths[i] ?? 10);
    })
    .join(" │ ");

  const separator = colWidths.map((w) => "─".repeat(w)).join("─┼─");

  return (
    <box
      flexGrow={1} border borderStyle="rounded"
      borderColor={borderColor} backgroundColor={THEME.panelBg}
      title={title} titleAlignment="center"
      flexDirection="column" onMouseDown={onFocus}
    >
      <scrollbox focused={focused} flexGrow={1}>
        <box flexDirection="column">
          <text fg={THEME.accent}><strong>{headerLine}</strong></text>
          <text fg={THEME.border}>{separator}</text>
          {rows.map((row, ri) => (
            <text key={ri} fg={ri % 2 === 0 ? THEME.text : THEME.dim}>
              {row.map((cell, ci) => {
                const w = colWidths[ci] ?? 10;
                const sep = ci < row.length - 1 ? " │ " : "";
                if (cell === null || cell === undefined) {
                  return (
                    <span key={ci} fg={THEME.nullColor}>
                      {"NULL".padEnd(w)}{sep}
                    </span>
                  );
                }
                return formatCell(cell, w) + sep;
              })}
            </text>
          ))}
        </box>
      </scrollbox>
      <box paddingX={1} flexDirection="row" justifyContent="space-between">
        <text fg={THEME.success}>
          {result.rowCount} row{result.rowCount !== 1 ? "s" : ""}
          {sortCol !== null && (
            <span fg={THEME.dim}>
              {" "}· sorted by <span fg={THEME.accent}>{result.columns[sortCol]}</span>{" "}
              {sortAsc ? "↑" : "↓"}
            </span>
          )}
        </text>
        <text fg={THEME.dim}>
          <span fg={THEME.accent}>&lt;&gt;</span> sort{"  "}
          <span fg={THEME.accent}>s</span> dir{"  "}
          <span fg={THEME.accent}>e</span> export{"  "}
          {result.time.toFixed(1)}ms
        </text>
      </box>
    </box>
  );
}
