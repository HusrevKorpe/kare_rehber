// Türkiye telefon numarası normalizasyonu.
// Kabul edilen girdiler:
//   "5xxxxxxxxx" (10 hane)
//   "05xxxxxxxxx" (11 hane, başında 0)
//   "905xxxxxxxxx" (12 hane, başında 90)
//   "+90 5xx xxx xx xx" (boşluk/tire)
// Çıktı her zaman "+905xxxxxxxxx" (13 karakter, E.164).

export function normalizeTel(raw: string): string | null {
  if (!raw) return null;
  const sadece = raw.replace(/[^\d]/g, "");
  if (!sadece) return null;

  let body = sadece;
  if (body.length === 10 && body.startsWith("5")) {
    // 5xxxxxxxxx
  } else if (body.length === 11 && body.startsWith("05")) {
    body = body.slice(1);
  } else if (body.length === 12 && body.startsWith("90")) {
    body = body.slice(2);
  } else if (body.length === 13 && body.startsWith("905")) {
    body = body.slice(2);
  } else {
    return null;
  }

  if (body.length !== 10 || !body.startsWith("5")) return null;
  return "+90" + body;
}

export function gecerliTelMi(raw: string): boolean {
  return normalizeTel(raw) !== null;
}

export function telGosterim(tel: string): string {
  // "+905551234567" -> "+90 555 123 45 67"
  if (tel.length !== 13 || !tel.startsWith("+90")) return tel;
  const n = tel.slice(3);
  return `+90 ${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6, 8)} ${n.slice(8, 10)}`;
}
