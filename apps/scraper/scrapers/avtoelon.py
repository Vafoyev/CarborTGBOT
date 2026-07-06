"""
CarBor Scraper - Avtoelon.uz Parser
Avtoelon.uz dan mashinalarni oladi
"""
import httpx
from selectolax.parser import HTMLParser
from config import HEADERS
from scrapers.olx import extract_price, extract_brand_model, extract_year


AVTOELON_URL = "https://avtoelon.uz/uz/listing"


def scrape_avtoelon() -> list[dict]:
    """Avtoelon.uz dan mashinalar ro'yxatini olish"""
    cars = []

    params = {
        "category": "1",  # Yengil avtomobillar
        "sort": "-created_at",  # Eng yangilari
    }

    try:
        response = httpx.get(
            AVTOELON_URL,
            params=params,
            headers=HEADERS,
            timeout=30,
            follow_redirects=True,
        )
        response.raise_for_status()
    except Exception as e:
        print(f"    Avtoelon HTTP xatolik: {e}")
        return cars

    tree = HTMLParser(response.text)

    # Avtoelon e'lonlar
    listings = tree.css(".listing-item, .product-card, [class*='listing']")

    # Agar CSS selector ishlamasa — boshqa variantlar
    if not listings:
        listings = tree.css("a[href*='/uz/listing/view/']")

    for item in listings:
        try:
            car = parse_avtoelon_item(item)
            if car:
                cars.append(car)
        except Exception:
            continue

    return cars


def parse_avtoelon_item(item) -> dict | None:
    """Bitta Avtoelon e'lonni parse qilish"""

    # Sarlavha
    title_el = item.css_first("h3, .title, [class*='title'], [class*='name']")
    if not title_el:
        # Agar element o'zi <a> bo'lsa
        title = item.text(strip=True)[:100]
    else:
        title = title_el.text(strip=True)

    if not title or len(title) < 3:
        return None

    # Narx
    price_el = item.css_first("[class*='price'], .price, strong")
    price_text = price_el.text(strip=True) if price_el else ""
    price = extract_price(price_text)
    if not price:
        return None

    # Link
    if item.tag == "a":
        href = item.attributes.get("href", "")
    else:
        link_el = item.css_first("a")
        href = link_el.attributes.get("href", "") if link_el else ""

    if href.startswith("/"):
        url = f"https://avtoelon.uz{href}"
    elif href.startswith("http"):
        url = href
    else:
        return None

    # External ID
    external_id = f"avtoelon_{href.split('/')[-1]}"

    # Rasm
    img_el = item.css_first("img")
    image_url = ""
    if img_el:
        image_url = img_el.attributes.get("src", "") or img_el.attributes.get("data-src", "")

    # Brand va Model
    brand, model = extract_brand_model(title)

    # Yil
    year = extract_year(title)

    # Shahar
    location_el = item.css_first("[class*='location'], [class*='city'], .region")
    city = location_el.text(strip=True) if location_el else ""

    return {
        "externalId": external_id,
        "source": "avtoelon",
        "title": title,
        "brand": brand,
        "model": model,
        "price": price,
        "year": year,
        "city": city,
        "url": url,
        "imageUrl": image_url,
    }
