import type { SmsSaglayici } from "./types";

// Netgsm REST v2 SMS API.
// Doküman: https://www.netgsm.com.tr/dokuman/
// Endpoint kabul ettiği numara formatı: 10 hane, başında 5 (örn. "5551112233").
// Bizim normalize ettiğimiz format "+90 5xx ..." olduğu için "+90" kırpılır.

const ENDPOINT = "https://api.netgsm.com.tr/sms/rest/v2/send";

function tlNumaraya10Hane(tel: string): string {
  // "+905xxxxxxxxx" -> "5xxxxxxxxx"
  if (tel.startsWith("+90")) return tel.slice(3);
  if (tel.startsWith("90") && tel.length === 12) return tel.slice(2);
  return tel.replace(/[^\d]/g, "").replace(/^0/, "");
}

export const netgsmSaglayici: SmsSaglayici = {
  ad: "netgsm",
  async gonder({ aliciTel, icerik }) {
    const kullanici = process.env.NETGSM_USERNAME;
    const parola = process.env.NETGSM_PASSWORD;
    const baslik = process.env.NETGSM_HEADER;
    if (!kullanici || !parola || !baslik) {
      return {
        basarili: false,
        saglayici: "netgsm",
        hata: "NETGSM_USERNAME/PASSWORD/HEADER env değerleri eksik",
      };
    }

    const auth = Buffer.from(`${kullanici}:${parola}`).toString("base64");
    const govde = {
      msgheader: baslik,
      encoding: "TR",
      iysfilter: "",
      partnercode: "",
      messages: [{ msg: icerik, no: tlNumaraya10Hane(aliciTel) }],
    };

    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${auth}`,
        },
        body: JSON.stringify(govde),
      });
      const metin = await res.text();
      let yanit: { code?: string; jobid?: string; description?: string } = {};
      try {
        yanit = JSON.parse(metin);
      } catch {
        yanit = { description: metin };
      }
      // Netgsm: code "00" başarılı (jobid döner). Aksi durum başarısız.
      const basarili = res.ok && (yanit.code === "00" || !!yanit.jobid);
      return {
        basarili,
        saglayici: "netgsm",
        saglayiciYanit: yanit.jobid ?? yanit.code ?? metin.slice(0, 200),
        hata: basarili
          ? undefined
          : yanit.description ?? `HTTP ${res.status}: ${metin.slice(0, 200)}`,
      };
    } catch (e) {
      return {
        basarili: false,
        saglayici: "netgsm",
        hata: e instanceof Error ? e.message : "Netgsm istek hatası",
      };
    }
  },
};
