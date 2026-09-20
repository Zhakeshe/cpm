export type CsvColumn<T> = {
  key: keyof T | string;
  label: string;
  value?: (row: T) => unknown;
};

function escapeCell(value: unknown) {
  if (value == null) return "";
  if (value instanceof Date) return value.toISOString();
  const text = String(value);
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

export function toCsv<T extends Record<string, unknown>>(rows: T[], columns: CsvColumn<T>[]) {
  const header = columns.map((c) => escapeCell(c.label)).join(",");
  const body = rows.map((row) =>
    columns
      .map((column) => {
        const raw = column.value ? column.value(row) : row[column.key as keyof T];
        return escapeCell(raw);
      })
      .join(","),
  );
  return [header, ...body].join("\r\n");
}

export function parseCsv(text: string): string[][] {
  const src = text.replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else if (ch === '"') {
        quoted = false;
      } else {
        cell += ch;
      }
      continue;
    }
    if (ch === '"') {
      quoted = true;
    } else if (ch === ",") {
      row.push(cell.trim());
      cell = "";
    } else if (ch === "\n") {
      row.push(cell.trim());
      if (row.some((c) => c)) rows.push(row);
      row = [];
      cell = "";
    } else if (ch !== "\r") {
      cell += ch;
    }
  }
  row.push(cell.trim());
  if (row.some((c) => c)) rows.push(row);
  return rows;
}

function normHeader(value: string) {
  return value
    .toLowerCase()
    .replace(/^\uFEFF/, "")
    .replace(/[\s-]+/g, "_");
}

const HEADER_ALIASES: Record<string, string> = {
  first_name: "firstName",
  firstname: "firstName",
  name: "firstName",
  имя: "firstName",
  аты: "firstName",
  last_name: "lastName",
  lastname: "lastName",
  фамилия: "lastName",
  phone: "phone",
  телефон: "phone",
  email: "email",
  comment: "comment",
  комментарий: "comment",
  source: "source",
  источник: "source",
};

export type ImportedLeadRow = {
  firstName: string;
  lastName?: string;
  phone: string;
  email?: string;
  comment?: string;
  source?: string;
  line: number;
};

export function mapLeadImportRows(table: string[][]): { rows: ImportedLeadRow[]; error?: string } {
  if (table.length < 2) return { rows: [], error: "EMPTY_CSV" };
  const headers = table[0].map(normHeader);
  const index: Record<string, number> = {};
  headers.forEach((h, i) => {
    const key = HEADER_ALIASES[h];
    if (key) index[key] = i;
  });
  if (index.phone == null) return { rows: [], error: "PHONE_COLUMN_REQUIRED" };
  if (index.firstName == null) return { rows: [], error: "NAME_COLUMN_REQUIRED" };
  const rows: ImportedLeadRow[] = [];
  table.slice(1).forEach((cells, offset) => {
    const get = (key: string) => (index[key] == null ? "" : cells[index[key]] || "");
    rows.push({
      firstName: get("firstName"),
      lastName: get("lastName") || undefined,
      phone: get("phone"),
      email: get("email") || undefined,
      comment: get("comment") || undefined,
      source: get("source") || undefined,
      line: offset + 2,
    });
  });
  return { rows };
}

export function csvFilename(prefix: string, now = new Date()) {
  const stamp = now.toISOString().slice(0, 19).replace(/[:T]/g, "-");
  return `${prefix}-${stamp}.csv`;
}
