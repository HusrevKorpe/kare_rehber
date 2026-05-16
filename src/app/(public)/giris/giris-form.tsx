"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { girisYap, type GirisDurumu } from "@/server/oturum";

const baslangic: GirisDurumu = {};

export function GirisForm() {
  const [durum, action, bekliyor] = useActionState(girisYap, baslangic);
  const [telefon, setTelefon] = useState("");
  const [parola, setParola] = useState("");
  const [dogumTarihi, setDogumTarihi] = useState("");

  return (
    <form action={action} className="space-y-4">
      {durum.hata ? <Alert tonu="hata">{durum.hata}</Alert> : null}

      <Field label="Telefon" htmlFor="telefon" zorunlu>
        <Input
          id="telefon"
          name="telefon"
          type="tel"
          autoComplete="username"
          placeholder="+90 5xx xxx xx xx"
          required
          value={telefon}
          onChange={(e) => setTelefon(e.target.value)}
        />
      </Field>

      <Field label="Doğum Tarihi" htmlFor="dogumTarihi">
        <Input
          id="dogumTarihi"
          name="dogumTarihi"
          type="date"
          value={dogumTarihi}
          onChange={(e) => setDogumTarihi(e.target.value)}
        />
      </Field>

      <Field label="Parola" htmlFor="parola">
        <Input
          id="parola"
          name="parola"
          type="password"
          autoComplete="current-password"
          value={parola}
          onChange={(e) => setParola(e.target.value)}
        />
      </Field>

      <Button type="submit" disabled={bekliyor} className="w-full" size="lg">
        {bekliyor ? "Giriş yapılıyor..." : "Giriş Yap"}
      </Button>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1 text-xs opacity-60"
          onClick={() => {
            setTelefon("+905555555555");
            setParola("Admin1234!");
            setDogumTarihi("");
          }}
        >
          Test (Admin)
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1 text-xs opacity-60"
          onClick={() => {
            setTelefon("+905550000001");
            setDogumTarihi("2010-01-15");
            setParola("");
          }}
        >
          Test (Öğrenci)
        </Button>
      </div>
    </form>
  );
}
