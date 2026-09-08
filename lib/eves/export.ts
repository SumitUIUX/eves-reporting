import type { ReportDataset } from "./types";
// Neutralize formula interpretation when opening a CSV in a spreadsheet application.
export function csvCell(value: string) {
  const safe = /^[\t\r\n]|^\s*[=+@]|^\s*-(?!\d+(?:\.\d+)?\s*$)/.test(value)
    ? `'${value}`
    : value;
  return `"${safe.replaceAll('"', '""')}"`;
}
export function csvText(data: ReportDataset) {
  return (
    "\uFEFF" +
    [data.headers, ...data.rows]
      .map((row) => row.map(csvCell).join(","))
      .join("\r\n")
  );
}
export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function downloadCsv(data: ReportDataset, name: string) {
  downloadBlob(
    new Blob([csvText(data)], { type: "text/csv;charset=utf-8" }),
    name + ".csv",
  );
}
