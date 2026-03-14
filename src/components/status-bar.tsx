import { basename } from "path";

const THEME = {
  panelBg: "#24283b",
  accent: "#7aa2f7",
  dim: "#565f89",
  success: "#9ece6a",
  warning: "#e0af68",
};

const PANEL_LABELS: Record<string, string> = {
  tables: "TABLES",
  editor: "EDITOR",
  results: "RESULTS",
};

interface StatusBarProps {
  dbPath: string;
  tableCount: number;
  focusedPanel: string;
  historyLength: number;
  statusMsg: string;
}

export function StatusBar({ dbPath, tableCount, focusedPanel, historyLength, statusMsg }: StatusBarProps) {
  return (
    <box
      height={1}
      flexDirection="row"
      backgroundColor={THEME.panelBg}
      justifyContent="space-between"
      paddingX={1}
    >
      <text fg={THEME.dim}>
        {statusMsg ? (
          <span fg={THEME.warning}>{statusMsg}</span>
        ) : (
          <>
            <span fg={THEME.accent}>Tab</span> switch
            {"  "}
            <span fg={THEME.accent}>F5</span>/<span fg={THEME.accent}>Ctrl+↵</span> run
            {"  "}
            <span fg={THEME.accent}>?</span> help
            {"  "}
            <span fg={THEME.accent}>Ctrl+D</span> disconnect
            {"  "}
            <span fg={THEME.accent}>Ctrl+C</span> quit
            {"   │   "}
            <span fg={THEME.accent}>{PANEL_LABELS[focusedPanel] ?? focusedPanel}</span>
            {historyLength > 0 && (
              <span fg={THEME.dim}>{" "}· {historyLength} in history</span>
            )}
          </>
        )}
      </text>
      <text fg={THEME.dim}>
        <span fg={THEME.success}>{basename(dbPath)}</span>
        {"  "}{tableCount} table{tableCount !== 1 ? "s" : ""}
      </text>
    </box>
  );
}
