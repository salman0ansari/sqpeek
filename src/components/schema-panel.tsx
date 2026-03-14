import { Database } from "bun:sqlite";
import { describeTable } from "../db";

const THEME = {
  panelBg: "#1f2335",
  accent: "#7aa2f7",
  border: "#414868",
  text: "#c0caf5",
  dim: "#565f89",
  nullColor: "#bb9af7",
};

interface SchemaPanelProps {
  db: Database;
  tableName: string;
  onClose: () => void;
  onQuery: (sql: string) => void;
}

export function SchemaPanel({ db, tableName, onClose, onQuery }: SchemaPanelProps) {
  const columns = describeTable(db, tableName);

  return (
    <box
      position="absolute"
      top={2}
      left={4}
      width={70}
      height={20}
      border
      borderStyle="rounded"
      borderColor={THEME.accent}
      backgroundColor={THEME.panelBg}
      title={` Schema: ${tableName} `}
      titleAlignment="center"
      flexDirection="column"
      zIndex={10}
    >
      <box paddingX={2} paddingTop={1}>
        <text fg={THEME.accent}>
          <strong>{"Column".padEnd(20)}{"Type".padEnd(14)}{"Not Null".padEnd(10)}{"PK".padEnd(5)}Default</strong>
        </text>
      </box>
      <box paddingX={2}>
        <text fg={THEME.border}>{"─".repeat(62)}</text>
      </box>

      <scrollbox focused flexGrow={1}>
        <box flexDirection="column" paddingX={2}>
          {columns.map((col) => (
            <text key={col.name} fg={col.pk ? THEME.accent : THEME.text}>
              {col.name.padEnd(20)}
              {(col.type || "ANY").padEnd(14)}
              {(col.notnull ? "✓" : "").padEnd(10)}
              {(col.pk ? "✓" : "").padEnd(5)}
              {col.dflt_value !== null && col.dflt_value !== undefined ? String(col.dflt_value) : ""}
            </text>
          ))}
        </box>
      </scrollbox>

      <box paddingX={2} paddingY={1} flexDirection="row" gap={2}>
        <box
          border borderStyle="rounded" borderColor={THEME.accent} paddingX={1}
          onMouseDown={() => onQuery(`SELECT * FROM "${tableName}" LIMIT 100`)}
        >
          <text fg={THEME.accent}>Browse table</text>
        </box>
        <box
          border borderStyle="rounded" borderColor={THEME.dim} paddingX={1}
          onMouseDown={() => onQuery(`SELECT COUNT(*) as count FROM "${tableName}"`)}
        >
          <text fg={THEME.dim}>Count rows</text>
        </box>
        <box flexGrow={1} />
        <box
          border borderStyle="rounded" borderColor={THEME.border} paddingX={1}
          onMouseDown={onClose}
        >
          <text fg={THEME.dim}>Close (Esc)</text>
        </box>
      </box>
    </box>
  );
}
