export type SmsGonderimSonucu = {
  basarili: boolean;
  saglayici: string;
  saglayiciYanit?: string;
  hata?: string;
};

export interface SmsSaglayici {
  ad: string;
  gonder(input: {
    aliciTel: string;
    icerik: string;
  }): Promise<SmsGonderimSonucu>;
}
