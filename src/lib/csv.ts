function csvHucre(v: unknown): string {
  if (v === null || v === undefined) return "";
  let s: string;
  if (v instanceof Date) {
    s = v.toISOString();
  } else if (typeof v === "object") {
    s = JSON.stringify(v);
  } else {
    s = String(v);
  }
  const kacisli = s.replace(/"/g, '""');
  return /[",\n;]/.test(kacisli) ? `"${kacisli}"` : kacisli;
}

export function csvSerialize(
  basliklar: string[],
  satirlar: ReadonlyArray<ReadonlyArray<unknown>>,
): string {
  const lines: string[] = [];
  lines.push(basliklar.map(csvHucre).join(","));
  for (const r of satirlar) lines.push(r.map(csvHucre).join(","));
  // BOM, Excel'in UTF-8 algılaması için.
  return "﻿" + lines.join("\n");
}

export function csvYanit(icerik: string, dosyaAdi: string): Response {
  return new Response(icerik, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${dosyaAdi}"`,
      "Cache-Control": "no-store",
    },
  });
}
