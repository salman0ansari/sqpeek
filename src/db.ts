import { Database } from "bun:sqlite";

export interface QueryResult {
  columns: string[];
  rows: any[][];
  rowCount: number;
  time: number;
  error?: string;
  affectedRows?: number;
}

export interface ColumnInfo {
  cid: number;
  name: string;
  type: string;
  notnull: boolean;
  dflt_value: any;
  pk: boolean;
}

export interface TableInfo {
  name: string;
  rowCount: number;
}

export function listTables(db: Database): string[] {
  const rows = db
    .query(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    )
    .all() as { name: string }[];
  return rows.map((r) => r.name);
}

export function listTablesWithCounts(db: Database): TableInfo[] {
  const tables = listTables(db);
  return tables.map((name) => {
    try {
      const row = db
        .query(`SELECT COUNT(*) as c FROM "${name}"`)
        .get() as { c: number };
      return { name, rowCount: row.c };
    } catch {
      return { name, rowCount: -1 };
    }
  });
}

export function describeTable(db: Database, tableName: string): ColumnInfo[] {
  const rows = db
    .query(`PRAGMA table_info("${tableName}")`)
    .all() as {
    cid: number;
    name: string;
    type: string;
    notnull: number;
    dflt_value: any;
    pk: number;
  }[];
  return rows.map((r) => ({
    cid: r.cid,
    name: r.name,
    type: r.type || "ANY",
    notnull: r.notnull === 1,
    dflt_value: r.dflt_value,
    pk: r.pk === 1,
  }));
}

export function executeQuery(db: Database, sql: string): QueryResult {
  const start = performance.now();
  try {
    const trimmed = sql.trim();
    if (!trimmed) {
      return { columns: [], rows: [], rowCount: 0, time: 0, error: "Empty query" };
    }

    const isSelect = /^(SELECT|PRAGMA|EXPLAIN|WITH)\b/i.test(trimmed);

    if (isSelect) {
      const allRows = db.query(trimmed).all() as Record<string, any>[];
      const time = performance.now() - start;

      if (allRows.length === 0) {
        return { columns: [], rows: [], rowCount: 0, time };
      }

      const columns = Object.keys(allRows[0]!);
      const rows = allRows.map((row) => columns.map((col) => row[col]));
      return { columns, rows, rowCount: rows.length, time };
    } else {
      const stmt = db.prepare(trimmed);
      const info = stmt.run();
      const time = performance.now() - start;
      return {
        columns: ["status"],
        rows: [["OK"]],
        rowCount: 0,
        affectedRows: (info as any).changes ?? 0,
        time,
      };
    }
  } catch (e: any) {
    const time = performance.now() - start;
    return { columns: [], rows: [], rowCount: 0, time, error: e.message || String(e) };
  }
}

export function exportToCsv(result: QueryResult): string {
  if (!result.columns.length) return "";
  const escape = (v: any) => {
    if (v === null || v === undefined) return "NULL";
    const s = String(v);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const header = result.columns.map(escape).join(",");
  const body = result.rows.map((row) => row.map(escape).join(",")).join("\n");
  return header + "\n" + body;
}
