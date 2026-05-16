import type { SmsSaglayici } from "./types";

// İletimerkezi JSON API.
// Endpoint: https://api.iletimerkezi.com/v1/send-sms/json
// Auth: username/password (request.authentication).
// Numara formatı: 12 hane "905xxxxxxxxx" (örnek dokümantasyon).

const ENDPOINT = "https://api.iletimerkezi.com/v1/send-sms/json";

function tlNumaraya12Hane(tel: string): string {
  if (tel.startsWith("+90")) return "90" + tel.slice(3);
  if (tel.startsWith("90") && tel.length === 12) return tel;
  const sadece = tel.replace(/[^\d]/g, "").replace(/^0/, "");
  return "90" + sadece;
}

export const iletimerkeziSaglayici: SmsSaglayici = {
  ad: "iletimerkezi",
  async gonder({ aliciTel, icerik }) {
    const kullanici = process.env.ILETIMERKEZI_USERNAME;
    const parola = process.env.ILETIMERKEZI_PASSWORD;
    const sender = process.env.ILETIMERKEZI_SENDER;
    if (!kullanici || !parola || !sender) {
      return {
        basarili: false,
        saglayici: "iletimerkezi",
        hata: "ILETIMERKEZI_USERNAME/PASSWORD/SENDER env değerleri eksik",
      };
    }

    const govde = {
      request: {
        authentication: { username: kullanici, password: parola },
        order: {
          sender,
          sendDateTime: [],
          iysFilter: "",
          message: {
            text: icerik,
            receipents: { number: [tlNumaraya12Hane(aliciTel)] },
          },
        },
      },
    };

    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(govde),
      });
      const metin = await res.text();
      let yanit: {
        response?: { status?: { code?: string; message?: string }; order?: { id?: string } };
      } = {};
      try {
        yanit = JSON.parse(metin);
      } catch {
        yanit = {};
      }
      const kod = yanit.response?.status?.code;
      // 200 başarılı; aksi başarısız.
      const basarili = res.ok && kod === "200";
      return {
        basarili,
        saglayici: "iletimerkezi",
        saglayiciYanit: yanit.response?.order?.id ?? kod ?? metin.slice(0, 200),
        hata: basarili
          ? undefined
          : yanit.response?.status?.message ?? `HTTP ${res.status}: ${metin.slice(0, 200)}`,
      };
    } catch (e) {
      return {
        basarili: false,
        saglayici: "iletimerkezi",
        hata: e instanceof Error ? e.message : "İletimerkezi istek hatası",
      };
    }
  },
};
