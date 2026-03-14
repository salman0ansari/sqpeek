import { useState } from "react";
import { useKeyboard } from "@opentui/react";
import { Database } from "bun:sqlite";
import { listTablesWithCounts } from "../db";

const THEME = {
  panelBg: "#1f2335",
  accent: "#7aa2f7",
  border: "#414868",
  dim: "#565f89",
};

interface TableListProps {
  db: Database;
  focused: boolean;
  onTableSelect: (tableName: string) => void;
  onSchemaView: (tableName: string) => void;
  onFocus: () => void;
}

export function TableList({ db, focused, onTableSelect, onSchemaView, onFocus }: TableListProps) {
  const tables = listTablesWithCounts(db);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useKeyboard((key) => {
    if (!focused || tables.length === 0) return;
    if (key.name === "i") {
      const t = tables[selectedIndex];
      if (t) onSchemaView(t.name);
    }
  });

  const options = tables.map((t) => ({
    name: t.name,
    description: t.rowCount >= 0 ? `${t.rowCount} rows` : "",
    value: t.name,
  }));

  return (
    <box
      flexDirection="column"
      border
      borderStyle="rounded"
      borderColor={focused ? THEME.accent : THEME.border}
      backgroundColor={THEME.panelBg}
      width={30}
      title=" Tables "
      titleAlignment="center"
      onMouseDown={onFocus}
    >
      {tables.length === 0 ? (
        <box padding={1} flexGrow={1} alignItems="center" justifyContent="center">
          <text fg={THEME.dim}>No tables found</text>
        </box>
      ) : (
        <box flexDirection="column" flexGrow={1}>
          <select
            options={options}
            focused={focused}
            selectedIndex={selectedIndex}
            onChange={(i) => setSelectedIndex(i)}
            onSelect={(_i, opt) => opt && onTableSelect(opt.value as string)}
            selectedBackgroundColor="#292e42"
            selectedTextColor={THEME.accent}
            height={40}
            showScrollIndicator
          />
          <box
            paddingX={1}
            paddingBottom={1}
            flexDirection="row"
            justifyContent="space-between"
          >
            <text fg={THEME.dim}>
              {tables.length} table{tables.length !== 1 ? "s" : ""}
            </text>
            <text fg={THEME.dim}>
              <span fg={THEME.accent}>i</span> schema{"  "}
              <span fg={THEME.accent}>r</span> reload
            </text>
          </box>
        </box>
      )}
    </box>
  );
}
