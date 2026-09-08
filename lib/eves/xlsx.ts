import type { ReportDataset } from "./types";
import { downloadBlob } from "./export";
const encoder = new TextEncoder();
const xml = (v: string) =>
  v
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
const col = (n: number): string =>
  n < 26
    ? String.fromCharCode(65 + n)
    : col(Math.floor(n / 26) - 1) + col(n % 26);
function crc32(data: Uint8Array) {
  let c = 0xffffffff;
  for (const b of data) {
    c ^= b;
    for (let i = 0; i < 8; i++) c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
  }
  return (c ^ 0xffffffff) >>> 0;
}
export function createZip(files: Record<string, string>) {
  const chunks: Uint8Array[] = [],
    central: Uint8Array[] = [];
  let offset = 0;
  for (const [name, body] of Object.entries(files)) {
    const n = encoder.encode(name),
      data = encoder.encode(body),
      crc = crc32(data),
      local = new Uint8Array(30 + n.length),
      lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, data.length, true);
    lv.setUint32(22, data.length, true);
    lv.setUint16(26, n.length, true);
    local.set(n, 30);
    chunks.push(local, data);
    const cd = new Uint8Array(46 + n.length),
      cv = new DataView(cd.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, data.length, true);
    cv.setUint32(24, data.length, true);
    cv.setUint16(28, n.length, true);
    cv.setUint32(42, offset, true);
    cd.set(n, 46);
    central.push(cd);
    offset += local.length + data.length;
  }
  const centralSize = central.reduce((a, b) => a + b.length, 0),
    end = new Uint8Array(22),
    ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(8, central.length, true);
  ev.setUint16(10, central.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true);
  const total = new Uint8Array(offset + centralSize + 22);
  let p = 0;
  for (const chunk of [...chunks, ...central, end]) {
    total.set(chunk, p);
    p += chunk.length;
  }
  return total;
}
export function createWorkbook(
  sheets: { name: string; data: ReportDataset }[],
) {
  const ns = "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
    rel = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
  const files: Record<string, string> = {
    "[Content_Types].xml": `<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>${sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("")}</Types>`,
    "_rels/.rels": `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${rel}/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    "xl/workbook.xml": `<workbook xmlns="${ns}" xmlns:r="${rel}"><sheets>${sheets.map((s, i) => `<sheet name="${xml(s.name.replace(/[\\/*?:\[\]]/g, " ").slice(0, 31))}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join("")}</sheets></workbook>`,
    "xl/_rels/workbook.xml.rels": `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="${rel}/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join("")}</Relationships>`,
  };
  for (let i = 0; i < sheets.length; i++) {
    const d = sheets[i].data;
    files[`xl/worksheets/sheet${i + 1}.xml`] =
      `<worksheet xmlns="${ns}"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>${d.headers.map((_, c) => `<col min="${c + 1}" max="${c + 1}" width="24" customWidth="1"/>`).join("")}</cols><sheetData>${[d.headers, ...d.rows].map((row, r) => `<row r="${r + 1}">${row.map((v, c) => `<c r="${col(c)}${r + 1}" t="inlineStr"><is><t xml:space="preserve">${xml(v)}</t></is></c>`).join("")}</row>`).join("")}</sheetData><autoFilter ref="A1:${col(d.headers.length - 1)}${d.rows.length + 1}"/></worksheet>`;
  }
  return createZip(files);
}
export function downloadExcel(
  sheets: { name: string; data: ReportDataset }[],
  name: string,
) {
  const bytes = createWorkbook(sheets);
  downloadBlob(
    new Blob([bytes.buffer as ArrayBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    name + ".xlsx",
  );
}
