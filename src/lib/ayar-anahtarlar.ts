export const AYAR_ANAHTARLARI = {
  gorusmePeriyotGun: "gorusme.periyot.gun",
  appAdi: "app.adi",
} as const;

export const AYAR_VARSAYILANLARI: Record<string, string> = {
  [AYAR_ANAHTARLARI.gorusmePeriyotGun]: "14",
  [AYAR_ANAHTARLARI.appAdi]: "KARE-Rehber",
};
