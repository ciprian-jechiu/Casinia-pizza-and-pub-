import "server-only";
import ExcelJS from "exceljs";
import { shortId, type ReservationRecord } from "./db";
import type { Status } from "./validation";

const STATUS_RO: Record<Status, string> = {
  new: "Nouă",
  confirmed: "Confirmată",
  done: "Finalizată",
  cancelled: "Anulată",
};
const STATUS_FILL: Record<Status, string> = {
  new: "FFF6D6D2",
  confirmed: "FFFBE7DF",
  done: "FFE6EBD6",
  cancelled: "FFE9E4E2",
};
const LANG: Record<string, string> = { ro: "Română", ru: "Rusă", en: "Engleză" };
const DAYS = ["Duminică", "Luni", "Marți", "Miercuri", "Joi", "Vineri", "Sâmbătă"];

const FONT = "Arial";
const HEADER_FILL = "FF4A161D"; // vișiniul site-ului
const HEADER_FONT = "FFF2E9DA";

/** "2026-10-20" → dată Excel (fără oră). */
function excelDate(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/** "19:30" → fracțiune de zi, afișată ca oră în Excel. */
function excelTime(hm: string) {
  const [h, m] = hm.split(":").map(Number);
  return (h * 60 + (m || 0)) / 1440;
}

/** Ora la care a venit rezervarea, în ora Chișinăului, ca dată Excel. */
function localDateTime(iso: string) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Chisinau",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(new Date(iso))
      .map((p) => [p.type, p.value]),
  );
  return new Date(Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute));
}

function styleHeader(row: ExcelJS.Row) {
  row.height = 22;
  row.eachCell((c) => {
    c.font = { name: FONT, bold: true, color: { argb: HEADER_FONT }, size: 10 };
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: HEADER_FILL } };
    c.alignment = { vertical: "middle" };
  });
}

export async function buildReservationsWorkbook(rows: ReservationRecord[], meta: { from?: string; to?: string; status?: string }) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Casinia Pizza Pub — site";
  wb.created = new Date();
  wb.calcProperties.fullCalcOnLoad = true;

  // ───────── Foaia 1: toate rezervările ─────────
  const ws = wb.addWorksheet("Rezervări", { views: [{ state: "frozen", ySplit: 1 }] });
  ws.columns = [
    { header: "Nr.", key: "nr", width: 10 },
    { header: "Data", key: "date", width: 12, style: { numFmt: "dd.mm.yyyy" } },
    { header: "Ziua", key: "day", width: 11 },
    { header: "Ora", key: "time", width: 8, style: { numFmt: "hh:mm" } },
    { header: "Persoane", key: "guests", width: 10 },
    { header: "Nume", key: "name", width: 24 },
    { header: "Telefon", key: "phone", width: 17 },
    { header: "Email", key: "email", width: 26 },
    { header: "Mențiuni", key: "notes", width: 40 },
    { header: "Status", key: "status", width: 13 },
    { header: "Limba site", key: "lang", width: 11 },
    { header: "Primită la", key: "created", width: 17, style: { numFmt: "dd.mm.yyyy hh:mm" } },
  ];
  styleHeader(ws.getRow(1));
  ws.pageSetup = { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0, paperSize: 9 };
  ws.pageSetup.printTitlesRow = "1:1";

  for (const r of rows) {
    const date = excelDate(r.date);
    const row = ws.addRow({
      nr: shortId(r.id),
      date,
      day: DAYS[date.getUTCDay()],
      time: excelTime(r.time),
      guests: r.guests,
      name: r.name,
      phone: r.phone, // text, ca să nu piardă „+” sau zerourile
      email: r.email ?? "",
      notes: r.notes ?? "",
      status: STATUS_RO[r.status] ?? r.status,
      lang: LANG[r.locale] ?? r.locale,
      created: localDateTime(r.created_at),
    });
    row.font = { name: FONT, size: 10 };
    row.alignment = { vertical: "top" };
    for (const k of ["date", "day", "time", "guests"]) row.getCell(k).alignment = { vertical: "top", horizontal: "center" };
    row.getCell("notes").alignment = { vertical: "top", wrapText: true };
    row.getCell("status").fill = { type: "pattern", pattern: "solid", fgColor: { argb: STATUS_FILL[r.status] ?? "FFFFFFFF" } };
  }
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: Math.max(1, rows.length + 1), column: ws.columnCount } };

  // ───────── Foaia 2: sumar pe zile (formule, se recalculează dacă editezi foaia 1) ─────────
  const sum = wb.addWorksheet("Sumar pe zile", { views: [{ state: "frozen", ySplit: 1 }] });
  sum.columns = [
    { header: "Data", key: "date", width: 12, style: { numFmt: "dd.mm.yyyy" } },
    { header: "Ziua", key: "day", width: 11 },
    { header: "Rezervări", key: "count", width: 11 },
    { header: "Persoane", key: "guests", width: 11 },
    { header: "Anulate", key: "cancelled", width: 10 },
  ];
  styleHeader(sum.getRow(1));

  const src = "'Rezervări'";
  const n = rows.length + 1;
  const days = [...new Set(rows.map((r) => r.date))].sort();
  days.forEach((d, i) => {
    const r = i + 2;
    const date = excelDate(d);
    const row = sum.addRow({ date, day: DAYS[date.getUTCDay()] });
    row.getCell("count").value = { formula: `COUNTIFS(${src}!$B$2:$B$${n},A${r},${src}!$J$2:$J$${n},"<>Anulată")` };
    row.getCell("guests").value = { formula: `SUMIFS(${src}!$E$2:$E$${n},${src}!$B$2:$B$${n},A${r},${src}!$J$2:$J$${n},"<>Anulată")` };
    row.getCell("cancelled").value = { formula: `COUNTIFS(${src}!$B$2:$B$${n},A${r},${src}!$J$2:$J$${n},"Anulată")` };
    row.font = { name: FONT, size: 10 };
  });

  const last = days.length + 1;
  const total = sum.addRow({ date: "Total" });
  if (days.length) {
    total.getCell("count").value = { formula: `SUM(C2:C${last})` };
    total.getCell("guests").value = { formula: `SUM(D2:D${last})` };
    total.getCell("cancelled").value = { formula: `SUM(E2:E${last})` };
  }
  total.font = { name: FONT, size: 10, bold: true };
  total.eachCell({ includeEmpty: true }, (c) => (c.border = { top: { style: "thin" } }));

  sum.addRow([]);
  const note = sum.addRow(["„Rezervări” și „Persoane” nu includ rezervările anulate."]);
  note.font = { name: FONT, size: 9, italic: true, color: { argb: "FF6F5753" } };
  const range = [meta.from && `de la ${meta.from}`, meta.to && `până la ${meta.to}`, meta.status && `status: ${STATUS_RO[meta.status as Status] ?? meta.status}`]
    .filter(Boolean)
    .join(", ");
  const info = sum.addRow([`Export din site: ${range || "toate rezervările"}.`]);
  info.font = { name: FONT, size: 9, italic: true, color: { argb: "FF6F5753" } };

  return wb.xlsx.writeBuffer();
}
