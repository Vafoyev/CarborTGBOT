"""
CarBor Scraper - OLX.uz Parser
OLX.uz/avtomobili sahifasidan mashinalarni oladi
"""
import httpx
from selectolax.parser import HTMLParser
from config import HEADERS


OLX_URL = "https://www.olx.uz/transport/legkovye-avtomobili/"


def scrape_olx() -> list[dict]:
    """OLX.uz dan mashinalar ro'yxatini olish"""
    cars = []

    try:
        response = httpx.get(
            OLX_URL,
            headers=HEADERS,
            timeout=30,
            follow_redirects=True,
        )
        response.raise_for_status()
    except Exception as e:
        print(f"    OLX HTTP xatolik: {e}")
        return cars

    tree = HTMLParser(response.text)

    # OLX e'lonlar ro'yxati
    listings = tree.css("[data-cy='l-card']")

    for item in listings:
        try:
            car = parse_olx_item(item)
            if car:
                cars.append(car)
        except Exception:
            continue

    return cars


def parse_olx_item(item) -> dict | None:
    """Bitta OLX e'lonni parse qilish"""

    # Sarlavha
    title_el = item.css_first("h6")
    if not title_el:
        return None
    title = title_el.text(strip=True)

    # Narx
    price_el = item.css_first("[data-testid='ad-price']")
    price_text = price_el.text(strip=True) if price_el else ""
    price = extract_price(price_text)
    if not price:
        return None

    # Link
    link_el = item.css_first("a")
    url = ""
    if link_el:
        href = link_el.attributes.get("href", "")
        if href.startswith("/"):
            url = f"https://www.olx.uz{href}"
        else:
            url = href

    # External ID (URL dan)
    external_id = f"olx_{url.split('/')[-1].split('.')[0]}" if url else None
    if not external_id:
        return None

    # Rasm
    img_el = item.css_first("img")
    image_url = img_el.attributes.get("src", "") if img_el else ""

    # Shahar
    location_el = item.css_first("[data-testid='location-date']")
    city = ""
    if location_el:
        loc_text = location_el.text(strip=True)
        city = loc_text.split(" - ")[0].strip() if " - " in loc_text else loc_text.split(",")[0].strip()

    # Brand va Model aniqlash
    brand, model = extract_brand_model(title)

    # Yil aniqlash
    year = extract_year(title)

    return {
        "externalId": external_id,
        "source": "olx",
        "title": title,
        "brand": brand,
        "model": model,
        "price": price,
        "year": year,
        "city": city,
        "url": url,
        "imageUrl": image_url,
    }


def extract_price(text: str) -> int | None:
    """Narx matnidan son olish: '$12 500' -> 12500"""
    import re
    # Faqat raqamlarni olish
    numbers = re.findall(r"\d+", text.replace(" ", ""))
    if numbers:
        try:
            price = int("".join(numbers))
            # Agar narx juda katta bo'lsa (so'mda) - USD ga aylantirish
            if price > 500000:
                price = price // 12500  # Taxminiy kurs
            return price if price > 100 else None
        except ValueError:
            return None
    return None


def extract_brand_model(title: str) -> tuple[str, str | None]:
    """Sarlavhadan brand va model aniqlash"""
    brands = {
        "chevrolet": ["gentra", "cobalt", "malibu", "tracker", "equinox", "onix", "spark", "nexia", "damas", "labo", "lacetti", "captiva", "orlando"],
        "hyundai": ["sonata", "tucson", "santa fe", "accent", "elantra", "creta", "porter"],
        "kia": ["k5", "sportage", "seltos", "cerato", "carnival", "sorento", "rio"],
        "toyota": ["camry", "corolla", "rav4", "land cruiser", "hilux", "prado", "fortuner"],
        "daewoo": ["matiz", "nexia", "gentra", "lacetti", "cobalt"],
        "byd": ["song plus", "han", "tang", "seal", "dolphin", "atto"],
        "haval": ["jolion", "dargo", "h6", "f7"],
        "chery": ["tiggo 7", "tiggo 4", "tiggo 8", "arrizo"],
        "volkswagen": ["polo", "golf", "tiguan", "jetta", "passat"],
        "mercedes": ["c-class", "e-class", "s-class", "gle", "gls"],
        "bmw": ["3 series", "5 series", "7 series", "x3", "x5", "x7"],
    }

    title_lower = title.lower()

    for brand, models in brands.items():
        if brand in title_lower:
            for model in models:
                if model in title_lower:
                    return brand.capitalize(), model.capitalize()
            return brand.capitalize(), None

    # Brand topilmasa — birinchi so'zni brand deb olish
    words = title.split()
    return words[0] if words else "Noma'lum", None


def extract_year(title: str) -> int | None:
    """Sarlavhadan yilni aniqlash"""
    import re
    years = re.findall(r"\b(20[0-2]\d|19[89]\d)\b", title)
    if years:
        return int(years[0])
    return None
