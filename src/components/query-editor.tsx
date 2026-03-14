import { useRef, useEffect } from "react";
import type { TextareaRenderable } from "@opentui/core";

const THEME = {
  panelBg: "#1f2335",
  accent: "#7aa2f7",
  border: "#414868",
  dim: "#565f89",
};

interface QueryEditorProps {
  initialValue: string;
  focused: boolean;
  historyLength: number;
  editorRef: React.RefObject<TextareaRenderable | null>;
  onFocus: () => void;
}

export function QueryEditor({
  initialValue,
  focused,
  historyLength,
  editorRef,
  onFocus,
}: QueryEditorProps) {
  // When initialValue changes from outside (history nav / table select),
  // push it into the uncontrolled textarea via the ref.
  const prevInitial = useRef(initialValue);
  useEffect(() => {
    if (initialValue !== prevInitial.current && editorRef.current) {
      editorRef.current.setText(initialValue);
      prevInitial.current = initialValue;
    }
  }, [initialValue, editorRef]);

  return (
    <box
      flexDirection="column"
      border
      borderStyle="rounded"
      borderColor={focused ? THEME.accent : THEME.border}
      backgroundColor={THEME.panelBg}
      title=" SQL Query "
      titleAlignment="center"
      height={12}
      onMouseDown={onFocus}
    >
      <textarea
        ref={editorRef as React.RefObject<TextareaRenderable>}
        initialValue={initialValue}
        focused={focused}
        placeholder="SELECT * FROM ..."
      />
      <box paddingX={1} flexDirection="row" justifyContent="space-between">
        <text fg={THEME.dim}>
          <span fg={THEME.accent}>F5</span>/<span fg={THEME.accent}>Ctrl+Enter</span> run
          {"  "}
          <span fg={THEME.accent}>Esc</span> leave editor
        </text>
        {historyLength > 0 && (
          <text fg={THEME.dim}>
            <span fg={THEME.accent}>↑↓</span> history ({historyLength})
          </text>
        )}
      </box>
    </box>
  );
}
