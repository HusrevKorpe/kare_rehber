"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import {
  ogrenciKocAta,
  ogrenciKocBitir,
  ogrenciKoordinatorAta,
  ogrenciKoordinatorBitir,
} from "@/server/eslestirme";

type KocSecenek = {
  id: string;
  adSoyad: string;
  uzmanlik: string | null;
  durum: "HAVUZ" | "AKTIF" | "PASIF";
};

type KoordSecenek = {
  id: string;
  adSoyad: string;
  vakifAdi: string;
};

type Props = {
  ogrenciUserId: string;
  ogrenciAdSoyad: string;
  kocEslestirmeId: string | null;
  koordEslestirmeId: string | null;
  koclar: KocSecenek[];
  koordinatorler: KoordSecenek[];
};

export function EslestirmeSatirAksiyon({
  ogrenciUserId,
  ogrenciAdSoyad,
  kocEslestirmeId,
  koordEslestirmeId,
  koclar,
  koordinatorler,
}: Props) {
  const router = useRouter();
  const [acik, setAcik] = useState<"yok" | "koc" | "koord">("yok");
  const [secimKoc, setSecimKoc] = useState("");
  const [secimKoord, setSecimKoord] = useState("");
  const [hata, setHata] = useState<string | null>(null);
  const [bekliyor, startTransition] = useTransition();

  const kocAtaTikla = () => {
    if (!secimKoc) {
      setHata("Lütfen bir koç seçin.");
      return;
    }
    if (
      !confirm(
        `${ogrenciAdSoyad} için koç ataması yapılacak. Mevcut atama varsa kapatılır. Devam?`,
      )
    )
      return;
    setHata(null);
    startTransition(async () => {
      const s = await ogrenciKocAta(ogrenciUserId, secimKoc);
      if (!s.ok) {
        setHata(s.hata);
        return;
      }
      setAcik("yok");
      setSecimKoc("");
      router.refresh();
    });
  };

  const koordAtaTikla = () => {
    if (!secimKoord) {
      setHata("Lütfen bir koordinatör seçin.");
      return;
    }
    if (
      !confirm(
        `${ogrenciAdSoyad} için koordinatör ataması yapılacak. Mevcut atama varsa kapatılır. Devam?`,
      )
    )
      return;
    setHata(null);
    startTransition(async () => {
      const s = await ogrenciKoordinatorAta(ogrenciUserId, secimKoord);
      if (!s.ok) {
        setHata(s.hata);
        return;
      }
      setAcik("yok");
      setSecimKoord("");
      router.refresh();
    });
  };

  const kocBitir = () => {
    if (!kocEslestirmeId) return;
    if (!confirm(`${ogrenciAdSoyad} için koç eşleştirmesi kapatılsın mı?`))
      return;
    setHata(null);
    startTransition(async () => {
      const s = await ogrenciKocBitir(kocEslestirmeId);
      if (!s.ok) {
        setHata(s.hata);
        return;
      }
      router.refresh();
    });
  };

  const koordBitir = () => {
    if (!koordEslestirmeId) return;
    if (!confirm(`${ogrenciAdSoyad} için koordinatör eşleştirmesi kapatılsın mı?`))
      return;
    setHata(null);
    startTransition(async () => {
      const s = await ogrenciKoordinatorBitir(koordEslestirmeId);
      if (!s.ok) {
        setHata(s.hata);
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="space-y-2">
      {hata ? <Alert tonu="hata">{hata}</Alert> : null}

      {acik === "yok" ? (
        <div className="flex flex-wrap justify-end gap-2">
          <Button size="sm" onClick={() => setAcik("koc")} disabled={bekliyor}>
            {kocEslestirmeId ? "Koç değiştir" : "Koç ata"}
          </Button>
          {kocEslestirmeId ? (
            <Button
              size="sm"
              variant="outline"
              onClick={kocBitir}
              disabled={bekliyor}
            >
              Koç kapat
            </Button>
          ) : null}
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setAcik("koord")}
            disabled={bekliyor}
          >
            {koordEslestirmeId ? "Koordinatör değiştir" : "Koordinatör ata"}
          </Button>
          {koordEslestirmeId ? (
            <Button
              size="sm"
              variant="outline"
              onClick={koordBitir}
              disabled={bekliyor}
            >
              Koord. kapat
            </Button>
          ) : null}
        </div>
      ) : null}

      {acik === "koc" ? (
        <div className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3 text-left">
          <Select
            value={secimKoc}
            onChange={(e) => setSecimKoc(e.target.value)}
          >
            <option value="">Koç seçin…</option>
            {koclar.map((k) => (
              <option key={k.id} value={k.id}>
                {k.adSoyad}
                {k.uzmanlik ? ` — ${k.uzmanlik}` : ""}
                {k.durum === "HAVUZ" ? " (havuz)" : ""}
              </option>
            ))}
          </Select>
          <div className="flex justify-end gap-2">
            <Button size="sm" onClick={kocAtaTikla} disabled={bekliyor}>
              Ata
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setAcik("yok");
                setSecimKoc("");
                setHata(null);
              }}
              disabled={bekliyor}
            >
              Vazgeç
            </Button>
          </div>
        </div>
      ) : null}

      {acik === "koord" ? (
        <div className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3 text-left">
          <Select
            value={secimKoord}
            onChange={(e) => setSecimKoord(e.target.value)}
          >
            <option value="">Koordinatör seçin…</option>
            {koordinatorler.map((k) => (
              <option key={k.id} value={k.id}>
                {k.adSoyad} — {k.vakifAdi}
              </option>
            ))}
          </Select>
          <div className="flex justify-end gap-2">
            <Button size="sm" onClick={koordAtaTikla} disabled={bekliyor}>
              Ata
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setAcik("yok");
                setSecimKoord("");
                setHata(null);
              }}
              disabled={bekliyor}
            >
              Vazgeç
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
