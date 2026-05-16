# KARE-Rehber

KARE Eğitim için koç-öğrenci takip ve değerlendirme platformu.
Koçlar, koordinatörler, veliler ve adminlerin tek bir sistemde buluştuğu, görüşme süreçlerini şeffaf şekilde kayıt altına alan bir Next.js uygulaması.

## Stack

- **Next.js 16** (App Router, TypeScript, Tailwind v4)
- **PostgreSQL 16** + **Prisma 7** (driver adapter: `@prisma/adapter-pg`)
- **Auth.js v5** (credentials, JWT)
- **Zod**, **React Hook Form**, **TanStack Table**, **lucide-react**

## Roller

`ADMIN · KOORDINATOR · KOC · OGRENCI · VELI`

| Aksiyon | Admin | Koord. | Koç | Öğr. | Veli |
|---|:-:|:-:|:-:|:-:|:-:|
| Kullanıcı yönetimi | ✅ | – | – | – | – |
| Eşleştirme | ✅ | – | – | – | – |
| Görüşme oluştur | – | – | ✅ | – | – |
| Görüşme onayla | ✅ | – | – | – | – |
| Görüşme görüntüle (onaysız) | ✅ | ✅ | ✅ (kendi) | – | – |
| Görüşme görüntüle (onaylı) | ✅ | ✅ | ✅ | ✅ | ✅ |
| SMS gönder | ✅ | – | – | – | – |

## Hızlı Başlangıç

### 1) Postgres (zaten lokalde çalışıyorsa atla)

```bash
# Lokal Postgres yoksa Docker ile:
docker compose up -d
```

`.env`'deki `DATABASE_URL` lokal kuruluma göre ayarlanmıştır.

### 2) DB kurulumu

```bash
npm install
npm run db:migrate    # şemayı uygula
npm run db:generate   # Prisma client üret
npm run db:seed       # ilk admin + varsayılan ayarlar
```

Seed admin bilgileri `.env` içindedir:

- Telefon: `+905555555555`
- Parola: `Admin1234!`

### 3) Geliştirme

```bash
npm run dev
```

`http://localhost:3000`

## Komutlar

| Komut | İşlev |
|---|---|
| `npm run dev` | Geliştirme sunucusu (Turbopack) |
| `npm run build` | Üretim derlemesi |
| `npm run start` | Üretim sunucusu |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Prisma migration (dev) |
| `npm run db:generate` | Prisma client üret |
| `npm run db:seed` | İlk admin + ayarlar |
| `npm run db:studio` | Prisma Studio |

## Klasör Yapısı

```
src/
├── app/
│   ├── (public)/        # landing, /giris, kayıt formları
│   ├── admin/           # admin paneli
│   ├── koordinator/
│   ├── koc/
│   ├── ogrenci/
│   ├── veli/
│   └── api/auth/[...nextauth]/
├── lib/
│   ├── auth/            # NextAuth config
│   ├── sms/             # SMS adapter (mock/netgsm/iletimerkezi)
│   ├── db.ts            # Prisma client
│   ├── permissions.ts   # RBAC yardımcıları
│   └── utils.ts
├── server/              # server actions
├── types/               # global tipler (next-auth augment)
├── components/ui/       # ortak UI
├── generated/prisma/    # Prisma client (gitignore'lanır önerilir)
└── proxy.ts             # Auth ile route koruma (eski "middleware")
```

> **Not**: Next.js 16'da `middleware.ts` deprecate edildi, yerine `proxy.ts` geldi. Aynı API.

## SMS Adapter

`.env` içinde `SMS_PROVIDER` ile seçilir:

- `mock` (varsayılan, konsola yazar)
- `netgsm` (TODO)
- `iletimerkezi` (TODO)

Her gönderim `SmsLog` tablosunda saklanır.

## Geliştirme Fazları

- **F0** — Proje iskeleti, Postgres, Prisma, Auth temel, landing/giriş ✅ (şu an)
- **F1** — Kullanıcı CRUD + roller + login + public formlar
- **F2** — Başvuru akışları (öğrenci/koç onay süreci)
- **F3** — Eşleştirme ekranları (il filtre + toplu)
- **F4** — Görüşme modülü + onay + log
- **F5** — Koç uyarı + SMS gönderimi
- **F6** — Mesajlaşma
- **F7** — Raporlar + dashboard
- **F8** — Polish, deployment
