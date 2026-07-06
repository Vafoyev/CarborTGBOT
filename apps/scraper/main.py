"""
CarBor Scraper - Entry Point
OLX va Avtoelon'dan mashinalarni har N sekundda tekshiradi
va yangi topilgan mashinalarni Redis orqali Bot'ga yuboradi.
"""
import time
import json
import redis
from config import REDIS_URL, SCRAPE_INTERVAL, CHANNEL_NEW_CAR, CHANNEL_STATUS
from scrapers.olx import scrape_olx
from scrapers.avtoelon import scrape_avtoelon

# Redis ulanish
try:
    r = redis.from_url(REDIS_URL)
    r.ping()
    print("✅ Redis ulandi")
except Exception as e:
    print(f"❌ Redis ulanmadi: {e}")
    print("💡 Bot'ga to'g'ridan-to'g'ri HTTP orqali yuboriladi")
    r = None

# Allaqachon yuborilgan mashinalar (dublikat oldini olish)
sent_cars = set()


def publish_car(car_data: dict):
    """Yangi mashinani Redis orqali Bot'ga yuborish"""
    external_id = car_data.get("externalId")

    if external_id in sent_cars:
        return False

    sent_cars.add(external_id)

    # Set hajmini cheklash (10000 dan oshmasin)
    if len(sent_cars) > 10000:
        sent_cars.clear()

    if r:
        r.publish(CHANNEL_NEW_CAR, json.dumps(car_data, ensure_ascii=False))
        print(f"  📨 Yuborildi: {car_data['title']} — ${car_data['price']}")
        return True
    else:
        print(f"  ⚠️ Redis yo'q, skip: {car_data['title']}")
        return False


def run_cycle():
    """Bitta scraping tsikli"""
    print(f"\n🔄 Yangi tsikl — {time.strftime('%H:%M:%S')}")

    # OLX
    try:
        olx_cars = scrape_olx()
        print(f"  🌐 OLX: {len(olx_cars)} ta mashina topildi")
        for car in olx_cars:
            publish_car(car)
    except Exception as e:
        print(f"  ❌ OLX xatolik: {e}")

    # Avtoelon
    try:
        avtoelon_cars = scrape_avtoelon()
        print(f"  🌐 Avtoelon: {len(avtoelon_cars)} ta mashina topildi")
        for car in avtoelon_cars:
            publish_car(car)
    except Exception as e:
        print(f"  ❌ Avtoelon xatolik: {e}")


def main():
    print("🕷️  CarBor Scraper ishga tushdi!")
    print(f"⏱️  Interval: har {SCRAPE_INTERVAL} sekund")
    print(f"📡 Redis: {'Ulangan' if r else 'Yo`q'}")
    print("-" * 40)

    if r:
        r.publish(CHANNEL_STATUS, json.dumps({
            "status": "started",
            "message": "Scraper ishga tushdi"
        }))

    while True:
        try:
            run_cycle()
        except KeyboardInterrupt:
            print("\n⛔ Scraper to'xtatildi")
            break
        except Exception as e:
            print(f"❌ Umumiy xatolik: {e}")

        time.sleep(SCRAPE_INTERVAL)


if __name__ == "__main__":
    main()
