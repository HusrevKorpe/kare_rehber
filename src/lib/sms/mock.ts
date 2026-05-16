import type { SmsSaglayici } from "./types";

export const mockSmsSaglayici: SmsSaglayici = {
  ad: "mock",
  async gonder({ aliciTel, icerik }) {
    // Geliştirme ortamında SMS göndermek yerine konsola yazıyoruz.
    // eslint-disable-next-line no-console
    console.log(`[SMS:mock] -> ${aliciTel}: ${icerik}`);
    return {
      basarili: true,
      saglayici: "mock",
      saglayiciYanit: `mock-${Date.now()}`,
    };
  },
};
