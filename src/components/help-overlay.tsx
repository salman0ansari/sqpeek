const THEME = {
  panelBg: "#1f2335",
  accent: "#7aa2f7",
  border: "#414868",
  text: "#c0caf5",
  dim: "#565f89",
};

interface HelpOverlayProps {
  onClose: () => void;
}

const SHORTCUTS: Array<{ section: string } | { key: string; desc: string }> = [
  { section: "Global" },
  { key: "Tab", desc: "Cycle focus: Tables → Editor → Results" },
  { key: "F5 / Ctrl+Enter", desc: "Run query (works from any panel)" },
  { key: "Ctrl+D", desc: "Disconnect — return to welcome screen" },
  { key: "Ctrl+C / q", desc: "Quit" },
  { key: "? / F1", desc: "Toggle this help" },

  { section: "Tables Panel" },
  { key: "Enter", desc: "Browse table (SELECT * LIMIT 100)" },
  { key: "i", desc: "View table schema" },
  { key: "r", desc: "Refresh table list" },
  { key: "↑ / ↓", desc: "Navigate tables" },

  { section: "Editor Panel" },
  { key: "Esc", desc: "Leave editor, return to Tables" },

  { section: "Results Panel" },
  { key: "↑ / ↓", desc: "Scroll results" },
  { key: "< / >", desc: "Select sort column" },
  { key: "s", desc: "Toggle sort direction (asc / desc)" },
  { key: "e", desc: "Export results to CSV file" },

  { section: "Welcome Screen" },
  { key: "Tab", desc: "Switch between path input and file list" },
  { key: "Enter", desc: "Connect to selected database" },
];

export function HelpOverlay({ onClose }: HelpOverlayProps) {
  return (
    <box
      position="absolute"
      top={1}
      left={2}
      width={62}
      height={34}
      border
      borderStyle="rounded"
      borderColor={THEME.accent}
      backgroundColor={THEME.panelBg}
      title=" Help — Keyboard Shortcuts "
      titleAlignment="center"
      flexDirection="column"
      zIndex={20}
    >
      <scrollbox focused flexGrow={1}>
        <box flexDirection="column" paddingX={2} paddingY={1}>
          {SHORTCUTS.map((item, i) => {
            if ("section" in item && !("key" in item)) {
              return (
                <box key={i} marginTop={i === 0 ? 0 : 1}>
                  <text fg={THEME.accent}><strong>{item.section}</strong></text>
                </box>
              );
            }
            const s = item as { key: string; desc: string };
            return (
              <box key={i} flexDirection="row">
                <text fg={THEME.accent} width={22}>{s.key}</text>
                <text fg={THEME.text}>{s.desc}</text>
              </box>
            );
          })}
        </box>
      </scrollbox>
      <box paddingX={2} paddingY={1} onMouseDown={onClose}>
        <text fg={THEME.dim}>
          Press <span fg={THEME.accent}>?</span> / <span fg={THEME.accent}>Esc</span> to close
        </text>
      </box>
    </box>
  );
}
