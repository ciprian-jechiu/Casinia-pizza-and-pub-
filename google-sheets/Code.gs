/**
 * Casinia Pizza Pub — legătura dintre site și Google Sheets.
 *
 * Tabelul este baza de date: fiecare rezervare / comandă de pe site devine imediat un rând nou,
 * iar statusul schimbat în tabel (coloana „Status”) se vede și în panoul de administrare al site-ului.
 *
 * Instalare (o singură dată):
 *   1. În tabel: Extensii → Apps Script → șterge tot și lipește acest fișier → Salvează.
 *   2. Setările proiectului (rotița) → Proprietăți script → adaugă SECRET = aceeași valoare ca
 *      GOOGLE_SHEETS_SECRET din site.
 *   3. Rulează o dată funcția `setup` (butonul ▶) și acceptă permisiunile.
 *   4. Implementare → Implementare nouă → tip „Aplicație web”:
 *        Execută ca: Eu · Cine are acces: Oricine → Implementează.
 *      Copiază URL-ul (…/exec) în GOOGLE_SHEETS_URL din site.
 *   La modificări ulterioare ale codului: Implementare → Gestionează implementările → Editează → Versiune nouă.
 */

var TZ = "Europe/Chisinau";

var STATUS_LABEL = { new: "Nouă", confirmed: "Confirmată", done: "Finalizată", cancelled: "Anulată" };
var STATUS_CODE = { "Nouă": "new", "Confirmată": "confirmed", "Finalizată": "done", "Anulată": "cancelled" };
var STATUS_COLOR = { "Nouă": "#f6d6d2", "Confirmată": "#fbe7df", "Finalizată": "#e6ebd6", "Anulată": "#e9e4e2" };
var LANG = { ro: "Română", ru: "Rusă", en: "Engleză" };
var LANG_CODE = { "Română": "ro", "Rusă": "ru", "Engleză": "en" };

var SHEETS = {
  reservations: {
    name: "Rezervări",
    headers: ["ID", "Nr.", "Data", "Ora", "Persoane", "Nume", "Telefon", "Email", "Mențiuni", "Status", "Limba", "Primită la"],
    widths: [60, 70, 95, 60, 75, 170, 125, 190, 280, 110, 80, 130],
    formats: { 3: "dd.mm.yyyy", 4: "@", 7: "@", 12: "dd.mm.yyyy hh:mm" },
    statusCol: 10,
  },
  orders: {
    name: "Comenzi",
    headers: ["ID", "Nr.", "Primită la", "Status", "Nume", "Telefon", "Mod", "Adresă", "Ora dorită", "Plată", "Produse", "Total (lei)", "Mențiuni", "Limba", "Produse (date)"],
    widths: [60, 70, 130, 110, 170, 125, 90, 220, 90, 80, 320, 90, 220, 80, 60],
    formats: { 3: "dd.mm.yyyy hh:mm", 6: "@", 9: "@", 12: "#,##0" },
    statusCol: 4,
  },
};

// ───────────────────────── punct de intrare ─────────────────────────

function doPost(e) {
  try {
    var body = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    var secret = PropertiesService.getScriptProperties().getProperty("SECRET");
    if (!secret || body.secret !== secret) return out({ error: "unauthorized" });

    switch (body.action) {
      case "createReservation":
        return out({ record: withLock(function () { return createReservation(body.data); }) });
      case "createOrder":
        return out({ record: withLock(function () { return createOrder(body.data); }) });
      case "list":
        return out({ orders: listOrders(), reservations: listReservations() });
      case "setStatus":
        withLock(function () { setStatus(body.table, body.id, body.status); });
        return out({ ok: true });
      case "ping":
        return out({ ok: true });
      default:
        return out({ error: "unknown_action" });
    }
  } catch (err) {
    return out({ error: String(err && err.message ? err.message : err) });
  }
}

function doGet() {
  return out({ ok: true, service: "casinia-sheets" });
}

function out(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function withLock(fn) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    return fn();
  } finally {
    lock.releaseLock();
  }
}

// ───────────────────────── structura tabelului ─────────────────────────

/** Creează / repară foile, antetele, formatele și lista de statusuri. Se poate rula oricând. */
function setup() {
  ensureSheet("reservations");
  ensureSheet("orders");
  var ss = SpreadsheetApp.getActive();
  ss.setSpreadsheetTimeZone(TZ);
  var first = ss.getSheets()[0];
  if (first.getName() !== SHEETS.reservations.name && first.getLastRow() === 0 && ss.getSheets().length > 2) ss.deleteSheet(first);
}

function ensureSheet(key) {
  var def = SHEETS[key];
  var ss = SpreadsheetApp.getActive();
  var sh = ss.getSheetByName(def.name);
  if (sh && sh.getLastRow() > 0) return sh;
  if (!sh) sh = ss.insertSheet(def.name);

  var cols = def.headers.length;
  if (sh.getMaxRows() < 5000) sh.insertRowsAfter(sh.getMaxRows(), 5000 - sh.getMaxRows());
  sh.getRange(1, 1, 1, cols)
    .setValues([def.headers])
    .setFontWeight("bold")
    .setFontColor("#f2e9da")
    .setBackground("#4a161d")
    .setVerticalAlignment("middle");
  sh.setFrozenRows(1);
  sh.setRowHeight(1, 30);
  for (var c = 1; c <= cols; c++) sh.setColumnWidth(c, def.widths[c - 1]);
  for (var col in def.formats) sh.getRange(2, Number(col), sh.getMaxRows() - 1, 1).setNumberFormat(def.formats[col]);

  // lista derulantă pentru status + culori
  var statusRange = sh.getRange(2, def.statusCol, sh.getMaxRows() - 1, 1);
  statusRange.setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(["Nouă", "Confirmată", "Finalizată", "Anulată"], true).setAllowInvalid(false).build(),
  );
  var rules = Object.keys(STATUS_COLOR).map(function (label) {
    return SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo(label).setBackground(STATUS_COLOR[label]).setRanges([statusRange]).build();
  });
  sh.setConditionalFormatRules(rules);

  sh.hideColumns(1); // ID intern
  if (key === "orders") sh.hideColumns(cols); // produsele în format brut, pentru site
  sh.getRange(1, 1, 1, cols).createFilter();
  return sh;
}

// ───────────────────────── rezervări ─────────────────────────

function createReservation(d) {
  var sh = ensureSheet("reservations");
  var rec = {
    id: d.id || Utilities.getUuid(),
    created_at: d.created_at || new Date().toISOString(),
    status: STATUS_LABEL[d.status] ? d.status : "new",
    locale: d.locale,
    name: d.name,
    phone: d.phone,
    email: d.email || null,
    date: d.date,
    time: d.time,
    guests: Number(d.guests),
    notes: d.notes || null,
  };
  sh.appendRow([
    rec.id,
    shortId(rec.id),
    parseYmd(rec.date),
    rec.time,
    rec.guests,
    safe(rec.name),
    safe(rec.phone),
    safe(rec.email || ""),
    safe(rec.notes || ""),
    STATUS_LABEL[rec.status],
    LANG[rec.locale] || rec.locale,
    new Date(rec.created_at),
  ]);
  return rec;
}

function listReservations() {
  return rows("reservations")
    .filter(function (r) { return r[0]; })
    .map(function (r) {
      return {
        id: String(r[0]),
        created_at: toIso(r[11]),
        status: STATUS_CODE[r[9]] || "new",
        locale: LANG_CODE[r[10]] || String(r[10] || "ro"),
        name: String(r[5]),
        phone: String(r[6]),
        email: r[7] ? String(r[7]) : null,
        date: toYmd(r[2]),
        time: toHm(r[3]),
        guests: Number(r[4]) || 0,
        notes: r[8] ? String(r[8]) : null,
      };
    })
    .sort(function (a, b) { return (a.date + a.time).localeCompare(b.date + b.time); });
}

// ───────────────────────── comenzi ─────────────────────────

function createOrder(d) {
  var sh = ensureSheet("orders");
  var rec = {
    id: d.id || Utilities.getUuid(),
    created_at: d.created_at || new Date().toISOString(),
    status: STATUS_LABEL[d.status] ? d.status : "new",
    locale: d.locale,
    name: d.name,
    phone: d.phone,
    method: d.method,
    address: d.address || null,
    scheduled_time: d.scheduled_time || null,
    payment: d.payment,
    notes: d.notes || null,
    items: d.items || [],
    total: Number(d.total),
  };
  var lines = safe(rec.items.map(function (i) { return i.qty + " × " + i.name; }).join("\n"));
  sh.appendRow([
    rec.id,
    shortId(rec.id),
    new Date(rec.created_at),
    STATUS_LABEL[rec.status],
    safe(rec.name),
    safe(rec.phone),
    rec.method === "delivery" ? "Livrare" : "Ridicare",
    safe(rec.address || ""),
    rec.scheduled_time || "Cât mai repede",
    rec.payment === "cash" ? "Numerar" : "Card",
    lines,
    rec.total,
    safe(rec.notes || ""),
    LANG[rec.locale] || rec.locale,
    JSON.stringify(rec.items),
  ]);
  return rec;
}

function listOrders() {
  return rows("orders")
    .filter(function (r) { return r[0]; })
    .map(function (r) {
      var items = [];
      try { items = JSON.parse(r[14] || "[]"); } catch (e) {}
      return {
        id: String(r[0]),
        created_at: toIso(r[2]),
        status: STATUS_CODE[r[3]] || "new",
        locale: LANG_CODE[r[13]] || String(r[13] || "ro"),
        name: String(r[4]),
        phone: String(r[5]),
        method: r[6] === "Livrare" ? "delivery" : "pickup",
        address: r[7] ? String(r[7]) : null,
        scheduled_time: r[8] && r[8] !== "Cât mai repede" ? toHm(r[8]) : null,
        payment: r[9] === "Numerar" ? "cash" : "card",
        notes: r[12] ? String(r[12]) : null,
        items: items,
        total: Number(r[11]) || 0,
      };
    })
    .sort(function (a, b) { return b.created_at.localeCompare(a.created_at); })
    .slice(0, 200);
}

// ───────────────────────── status ─────────────────────────

function setStatus(table, id, status) {
  var def = SHEETS[table];
  if (!def || !STATUS_LABEL[status]) throw new Error("invalid");
  var sh = ensureSheet(table);
  var last = sh.getLastRow();
  if (last < 2) return;
  var ids = sh.getRange(2, 1, last - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === id) {
      sh.getRange(i + 2, def.statusCol).setValue(STATUS_LABEL[status]);
      return;
    }
  }
}

// ───────────────────────── utilitare ─────────────────────────

function rows(key) {
  var sh = ensureSheet(key);
  var last = sh.getLastRow();
  if (last < 2) return [];
  return sh.getRange(2, 1, last - 1, SHEETS[key].headers.length).getValues();
}

/** Textul scris de clienți nu trebuie să fie interpretat ca formulă (=, +, -, @). */
function safe(v) {
  var s = v == null ? "" : String(v);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function shortId(uuid) {
  return uuid.replace(/-/g, "").slice(0, 6).toUpperCase();
}

function parseYmd(s) {
  var p = String(s).split("-");
  return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
}

function toYmd(v) {
  if (v instanceof Date) return Utilities.formatDate(v, TZ, "yyyy-MM-dd");
  var m = String(v).match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (m) return m[3] + "-" + ("0" + m[2]).slice(-2) + "-" + ("0" + m[1]).slice(-2);
  return String(v);
}

function toHm(v) {
  if (v instanceof Date) return Utilities.formatDate(v, TZ, "HH:mm");
  var m = String(v).match(/^(\d{1,2}):(\d{2})/);
  return m ? ("0" + m[1]).slice(-2) + ":" + m[2] : String(v);
}

function toIso(v) {
  if (v instanceof Date) return v.toISOString();
  var d = new Date(v);
  return isNaN(d.getTime()) ? new Date(0).toISOString() : d.toISOString();
}
