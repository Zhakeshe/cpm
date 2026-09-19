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

export function csvFilename(prefix: string, now = new Date()) {
  const stamp = now.toISOString().slice(0, 19).replace(/[:T]/g, "-");
  return `${prefix}-${stamp}.csv`;
}
