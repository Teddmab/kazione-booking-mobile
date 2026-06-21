import type { ImportClientRow } from "@/types/owner";

function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let cur = "";
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuote = !inQuote;
    } else if ((ch === "," || ch === "\t") && !inQuote) {
      result.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
  }
  result.push(cur.trim());
  return result;
}

function guessIndex(headers: string[], names: string[]): number {
  const normalized = headers.map((h) => h.toLowerCase().replace(/[^a-z]/g, ""));
  for (const name of names) {
    const idx = normalized.findIndex((h) => h.includes(name));
    if (idx >= 0) return idx;
  }
  return -1;
}

/** Parse CSV text into import rows (skips rows without first_name). */
export function parseClientCsv(text: string): ImportClientRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = splitCsvLine(lines[0]);
  const iFirst = guessIndex(headers, ["firstname", "first", "fname", "prenom"]);
  const iLast = guessIndex(headers, ["lastname", "last", "lname", "nom"]);
  const iEmail = guessIndex(headers, ["email", "mail"]);
  const iPhone = guessIndex(headers, ["phone", "mobile", "tel", "telephone"]);

  const get = (row: string[], idx: number) => (idx >= 0 ? row[idx]?.trim() ?? "" : "");

  const rows: ImportClientRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i]);
    const first_name = get(cells, iFirst >= 0 ? iFirst : 0);
    if (!first_name) continue;
    rows.push({
      first_name,
      last_name: get(cells, iLast >= 0 ? iLast : 1) || undefined,
      email: get(cells, iEmail) || undefined,
      phone: get(cells, iPhone) || undefined,
      source: "csv_import",
    });
  }
  return rows;
}
