# CarBor - Telegram Bot MVP

O'zbekiston avtomobil bozori uchun **Event-Driven Market Arbitrage System**.

Bot foydalanuvchilarga OLX, Avtoelon va boshqa saytlardan mos mashinalarni real-time topib xabar beradi.

## Hozirgi holat

| Parametr | Qiymat |
|----------|--------|
| **Bot** | [@moshintoparbot](https://t.me/moshintoparbot) |
| **Status** | ✅ Ishlayapti |
| **Server** | Local (Mac Mini) |
| **Database** | SQLite (fayl-based) |
| **Keyingi qadam** | VPS serverga deploy qilish |

> ⚠️ Hozir bot faqat kompyuter yoqiq bo'lganda ishlaydi. Production uchun VPS (Railway/Render/VPS) ga deploy kerak.

---

## Arxitektura

```
┌─────────────────────────────────────────────────────┐
│                    FOYDALANUVCHI                      │
│               (Telegram Bot orqali)                  │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────┐
│              TELEGRAM BOT (Telegraf.js)               │
│  /start │ Filtr qo'shish │ Matching Alert yuborish   │
└──────────────────────┬──────────────────────────────┘
                       │
              ┌────────┴────────┐
              ▼                 ▼
┌──────────────────┐  ┌─────────────────┐
│   PostgreSQL     │  │      Redis      │
│  (Prisma ORM)   │  │  (Pub/Sub)      │
│  Users, Filters  │  │  new_car events │
└──────────────────┘  └────────┬────────┘
                               │
                               ▼
                  ┌─────────────────────────┐
                  │    PYTHON SCRAPER       │
                  │  (OLX, Avtoelon, ...)   │
                  │  Playwright + Redis     │
                  └─────────────────────────┘
```

---

## Texnologiyalar

| Komponent | Texnologiya |
|-----------|-------------|
| Bot Framework | Telegraf.js v4 |
| Database | PostgreSQL 16 + Prisma ORM |
| Realtime | Redis 7 (Pub/Sub) |
| Runtime | Node.js 20+ |
| Container | Docker + Docker Compose |

---

## Local'da ishga tushirish

```bash
# 1. Node.js o'rnatilgan bo'lishi kerak (v18+)
# 2. Repo'ni clone qilish
git clone https://github.com/Vafoyev/CarborTGBOT.git
cd CarborTGBOT/apps/bot-core

# 3. .env faylni yaratish
cp .env.example .env
# .env ichiga BOT_TOKEN va BOT_ADMIN_ID yozing

# 4. Dependencies o'rnatish
npm install

# 5. Database tayyorlash
npx prisma generate
npx prisma db push

# 6. Botni ishga tushirish
node src/index.js
```

### Telegram'da tekshirish
1. [@moshintoparbot](https://t.me/moshintoparbot) ga boring
2. `/start` yozing
3. Menyu chiqadi — filtr qo'shing va kuting!

---

## Loyiha strukturasi

```
CarborTGBOT/
├── docker-compose.yml          # PostgreSQL + Redis + Bot
├── .env                        # Muhit o'zgaruvchilari
│
└── apps/
    └── bot-core/               # Telegram Bot (Node.js)
        ├── package.json
        ├── Dockerfile
        ├── prisma/
        │   └── schema.prisma   # Database modellari
        └── src/
            ├── index.js        # Entry point
            ├── config.js       # Konfiguratsiya
            ├── database.js     # Prisma client
            ├── bot/
            │   ├── commands/
            │   │   └── start.js       # /start, /help, /myfilters
            │   ├── keyboards/
            │   │   └── main.js        # Tugma layoutlari
            │   └── scenes/
            │       └── addFilter.js   # Filtr wizard (6 qadam)
            └── services/
                ├── user.service.js      # Foydalanuvchi CRUD
                ├── filter.service.js    # Filtr CRUD + matching
                ├── matching.service.js  # Core — mashina-filtr moslashtirish
                └── redis.listener.js    # Scraper'dan xabar qabul qilish
```

---

## Bot buyruqlari

| Buyruq | Tavsif |
|--------|--------|
| `/start` | Botni ishga tushirish, ro'yxatdan o'tish |
| `/help` | Yordam va ma'lumot |
| `/myfilters` | Filtrlaringizni ko'rish |
| `/deletefilters` | Barcha filtrlarni o'chirish |

---

## Matching Engine (Qanday ishlaydi)

1. **Scraper** yangi mashina topadi (OLX/Avtoelon)
2. Redis orqali `carbor:new_car` kanaliga **publish** qiladi
3. Bot **subscribe** bo'lib turgan — xabarni oladi
4. `matching.service.js` mashinani bazadagi barcha filtrlar bilan solishtiradi
5. Mos foydalanuvchilarga rasm + narx + link bilan **alert** yuboradi

### Scraper'dan Redis'ga yuborish formati:

```json
{
  "externalId": "olx_12345",
  "source": "olx",
  "title": "Chevrolet Gentra 2022",
  "brand": "Chevrolet",
  "model": "Gentra",
  "price": 12500,
  "year": 2022,
  "city": "Toshkent",
  "url": "https://olx.uz/ad/12345",
  "imageUrl": "https://olx.uz/img/12345.jpg"
}
```

---

## Keyingi qadamlar (Roadmap)

- [ ] Python Scraper (Playwright) — OLX, Avtoelon parsing
- [ ] Premium to'lov integratsiyasi (Click/Payme)
- [ ] Admin panel (statistika, foydalanuvchilar)
- [ ] Mobile App (React Native)
- [ ] AI narx tahlili (mashina arzon yoki qimmatligini aniqlash)

---

## Development

```bash
# Database studio (GUI)
npm run db:studio

# Database migratsiya
npm run db:migrate

# Production uchun butun tizimni ishga tushirish
docker-compose up -d
```

---

## Litsenziya

Private / Commercial use only.
