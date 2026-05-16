"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import type { Rol } from "@/generated/prisma/enums";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Select, Textarea } from "@/components/ui/input";
import { ROL_ETIKETLERI } from "@/lib/permissions";
import { cn, formatTr } from "@/lib/utils";
import { mesajGonder } from "@/server/mesaj";
import type { Konusma, ThreadMesaj } from "@/server/mesaj";

type Partner = { id: string; ad: string; soyad: string; rol: Rol };
type Alici = { id: string; ad: string; soyad: string; rol: Rol };

type Props = {
  panelHref: string;
  konusmalar: Konusma[];
  aktifPartner: Partner | null;
  aktifMesajlar: ThreadMesaj[];
  aliciAdaylari: Alici[];
};

export function MesajPaneli({
  panelHref,
  konusmalar,
  aktifPartner,
  aktifMesajlar,
  aliciAdaylari,
}: Props) {
  const router = useRouter();
  const [yeniAcik, setYeniAcik] = useState(false);
  const [yeniAliciId, setYeniAliciId] = useState("");
  const [yeniIcerik, setYeniIcerik] = useState("");
  const [cevap, setCevap] = useState("");
  const [hata, setHata] = useState<string | null>(null);
  const [bekliyor, startTransition] = useTransition();
  const threadRef = useRef<HTMLDivElement | null>(null);

  // Yeni mesaj sonrası ve thread değişince scroll dibe.
  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [aktifPartner?.id, aktifMesajlar.length]);

  const cevapGonder = () => {
    if (!aktifPartner) return;
    if (cevap.trim().length === 0) {
      setHata("Mesaj boş olamaz.");
      return;
    }
    setHata(null);
    startTransition(async () => {
      const s = await mesajGonder({
        aliciId: aktifPartner.id,
        icerik: cevap,
      });
      if (!s.ok) {
        setHata(s.hata);
        return;
      }
      setCevap("");
      router.refresh();
    });
  };

  const yeniGonder = () => {
    if (!yeniAliciId) {
      setHata("Lütfen bir alıcı seçin.");
      return;
    }
    if (yeniIcerik.trim().length === 0) {
      setHata("Mesaj boş olamaz.");
      return;
    }
    setHata(null);
    const aliciId = yeniAliciId;
    startTransition(async () => {
      const s = await mesajGonder({ aliciId, icerik: yeniIcerik });
      if (!s.ok) {
        setHata(s.hata);
        return;
      }
      setYeniAcik(false);
      setYeniAliciId("");
      setYeniIcerik("");
      router.push(`${panelHref}?ile=${aliciId}`);
    });
  };

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-[320px_1fr]">
      {/* Sol: konuşmalar listesi */}
      <aside className="rounded-lg border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-800">Konuşmalar</h2>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setYeniAcik((v) => !v);
              setHata(null);
            }}
            disabled={bekliyor}
          >
            {yeniAcik ? "Kapat" : "+ Yeni"}
          </Button>
        </div>

        {yeniAcik ? (
          <div className="space-y-3 border-b border-slate-200 px-4 py-3">
            {hata ? <Alert tonu="hata">{hata}</Alert> : null}
            <Field label="Alıcı" zorunlu>
              <Select
                value={yeniAliciId}
                onChange={(e) => setYeniAliciId(e.target.value)}
                disabled={bekliyor}
              >
                <option value="">Seçin…</option>
                {aliciAdaylari.length === 0 ? (
                  <option disabled value="">
                    Mesajlaşabileceğiniz kimse yok
                  </option>
                ) : null}
                {aliciAdaylari.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.ad} {a.soyad} — {ROL_ETIKETLERI[a.rol]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Mesaj" zorunlu>
              <Textarea
                rows={3}
                value={yeniIcerik}
                onChange={(e) => setYeniIcerik(e.target.value)}
                maxLength={4000}
                disabled={bekliyor}
              />
            </Field>
            <div className="flex justify-end">
              <Button size="sm" onClick={yeniGonder} disabled={bekliyor}>
                {bekliyor ? "Gönderiliyor…" : "Gönder"}
              </Button>
            </div>
          </div>
        ) : null}

        <ul className="max-h-[70vh] divide-y divide-slate-100 overflow-y-auto">
          {konusmalar.length === 0 ? (
            <li className="px-4 py-6 text-center text-sm text-slate-500">
              Henüz konuşma yok.
            </li>
          ) : null}
          {konusmalar.map((k) => {
            const aktif = aktifPartner?.id === k.partner.id;
            return (
              <li key={k.partner.id}>
                <Link
                  href={`${panelHref}?ile=${k.partner.id}`}
                  scroll={false}
                  className={cn(
                    "block px-4 py-3 transition-colors",
                    aktif ? "bg-slate-900 text-white" : "hover:bg-slate-50",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold">
                          {k.partner.ad} {k.partner.soyad}
                        </span>
                        <Badge tonu={aktif ? "notr" : "bilgi"}>
                          {ROL_ETIKETLERI[k.partner.rol]}
                        </Badge>
                      </div>
                      <p
                        className={cn(
                          "mt-1 truncate text-xs",
                          aktif ? "text-slate-200" : "text-slate-500",
                        )}
                      >
                        {k.sonMesaj.bendenMi ? "Siz: " : ""}
                        {k.sonMesaj.icerik}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={cn(
                          "text-[10px] whitespace-nowrap",
                          aktif ? "text-slate-300" : "text-slate-400",
                        )}
                      >
                        {kisaTarih(k.sonMesaj.tarih)}
                      </span>
                      {k.okunmamis > 0 ? (
                        <span className="grid min-w-5 place-items-center rounded-full bg-red-600 px-1.5 text-[10px] font-semibold leading-4 text-white">
                          {k.okunmamis > 99 ? "99+" : k.okunmamis}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </aside>

      {/* Sağ: aktif konuşma */}
      <section className="flex min-h-[60vh] flex-col rounded-lg border border-slate-200 bg-white">
        {aktifPartner ? (
          <>
            <header className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-semibold">
                    {aktifPartner.ad} {aktifPartner.soyad}
                  </span>
                  <Badge tonu="bilgi">{ROL_ETIKETLERI[aktifPartner.rol]}</Badge>
                </div>
              </div>
            </header>

            <div
              ref={threadRef}
              className="flex-1 space-y-3 overflow-y-auto bg-slate-50 px-5 py-4"
            >
              {aktifMesajlar.length === 0 ? (
                <p className="py-10 text-center text-sm text-slate-500">
                  Henüz mesaj yok. İlk mesajı siz gönderin.
                </p>
              ) : null}
              {aktifMesajlar.map((m) => (
                <div
                  key={m.id}
                  className={cn(
                    "flex",
                    m.bendenMi ? "justify-end" : "justify-start",
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-lg px-3 py-2 text-sm shadow-sm",
                      m.bendenMi
                        ? "bg-slate-900 text-white"
                        : "border border-slate-200 bg-white text-slate-800",
                    )}
                  >
                    {m.konu ? (
                      <div
                        className={cn(
                          "mb-1 text-xs font-semibold",
                          m.bendenMi ? "text-slate-200" : "text-slate-600",
                        )}
                      >
                        {m.konu}
                      </div>
                    ) : null}
                    <p className="whitespace-pre-wrap">{m.icerik}</p>
                    <div
                      className={cn(
                        "mt-1 flex items-center justify-end gap-1 text-[10px]",
                        m.bendenMi ? "text-slate-300" : "text-slate-400",
                      )}
                    >
                      <span>{formatTr(m.tarih)}</span>
                      {m.bendenMi ? (
                        <span>{m.okundu ? "• okundu" : "• gönderildi"}</span>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-200 p-3">
              {hata && !yeniAcik ? (
                <div className="mb-2">
                  <Alert tonu="hata">{hata}</Alert>
                </div>
              ) : null}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  cevapGonder();
                }}
                className="flex items-end gap-2"
              >
                <Textarea
                  rows={2}
                  value={cevap}
                  onChange={(e) => setCevap(e.target.value)}
                  maxLength={4000}
                  placeholder="Mesaj yazın…"
                  disabled={bekliyor}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      cevapGonder();
                    }
                  }}
                />
                <Button type="submit" disabled={bekliyor}>
                  {bekliyor ? "…" : "Gönder"}
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center px-6 py-10 text-center text-sm text-slate-500">
            Soldan bir konuşma seçin veya yeni mesaj başlatın.
          </div>
        )}
      </section>
    </div>
  );
}

function kisaTarih(d: Date) {
  const simdi = new Date();
  const ayni = d.toDateString() === simdi.toDateString();
  if (ayni) {
    return new Intl.DateTimeFormat("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  }
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
  }).format(d);
}
