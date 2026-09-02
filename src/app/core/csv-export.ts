export interface CsvColumn {
  key: string;
  label: string;
}

function sanitizeCsvField(value: string): string {
  // Prevent CSV-formula injection when the file is opened in a spreadsheet app.
  if (/^[=+\-@]/.test(value)) {
    return `'${value}`;
  }
  return value;
}

function formatCsvField(value: string | number): string {
  const raw = sanitizeCsvField(String(value));
  if (/[",\n]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

export function toCsv(rows: Record<string, string | number>[], columns: CsvColumn[]): string {
  const header = columns.map((c) => formatCsvField(c.label)).join(',');
  const lines = rows.map((row) => columns.map((c) => formatCsvField(row[c.key] ?? '')).join(','));
  return [header, ...lines].join('\r\n');
}

export function downloadCsv(filename: string, csvContent: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
