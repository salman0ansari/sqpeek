import { createCliRenderer } from "@opentui/core";
import { createRoot } from "@opentui/react";
import { App } from "./app";

const args = process.argv.slice(2);
const initialPath = args[0];

const renderer = await createCliRenderer({ exitOnCtrlC: false });
createRoot(renderer).render(<App initialPath={initialPath} />);
