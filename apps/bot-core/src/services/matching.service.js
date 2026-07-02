/**
 * CarBor Bot - Matching Service (Core Engine)
 * Scraper topgan mashinani foydalanuvchilar filtrlariga solishtiradi
 * va mos foydalanuvchilarga alert yuboradi
 */

const prisma = require('../database');
const { findMatchingFilters } = require('./filter.service');

/**
 * Yangi mashina topilganda ishga tushadigan asosiy funksiya
 * Scraper -> Redis -> shu funksiya -> Telegram alert
 *
 * @param {Object} bot - Telegraf bot instance
 * @param {Object} carData - Scraper'dan kelgan mashina ma'lumotlari
 * @returns {number} - Nechta foydalanuvchiga xabar yuborildi
 */
async function processNewCar(bot, carData) {
  const { externalId, source, title, brand, model, price, year, city, url, imageUrl, phone } = carData;

  // 1. Mashinani bazaga saqlash (dublikatni tekshirish)
  let car;
  try {
    car = await prisma.car.upsert({
      where: { externalId },
      update: { price, title, url, imageUrl },
      create: {
        externalId,
        source: source || 'unknown',
        title,
        brand,
        model: model || null,
        price,
        year: year || null,
        city: city || null,
        url,
        imageUrl: imageUrl || null,
        phone: phone || null,
      },
    });
  } catch (error) {
    console.error('Mashinani saqlashda xatolik:', error);
    return 0;
  }

  // 2. Mos filtrlarni topish
  const matchedFilters = await findMatchingFilters({ brand, model, price, year });

  if (matchedFilters.length === 0) {
    return 0;
  }

  // 3. Har bir mos foydalanuvchiga xabar yuborish
  let sentCount = 0;

  for (const filter of matchedFilters) {
    const { telegramId } = filter.user;

    // Dublikat tekshiruvi (bir mashinani ikki marta yubormaslik)
    const alreadySent = await prisma.notification.findUnique({
      where: {
        userId_carId: {
          userId: filter.userId,
          carId: car.id,
        },
      },
    });

    if (alreadySent) continue;

    // Alert xabarini tayyorlash
    const message = formatCarAlert(car, filter);

    try {
      // Rasm bilan yuborish (agar mavjud bo'lsa)
      if (imageUrl) {
        await bot.telegram.sendPhoto(telegramId.toString(), imageUrl, {
          caption: message,
          parse_mode: 'Markdown',
        });
      } else {
        await bot.telegram.sendMessage(telegramId.toString(), message, {
          parse_mode: 'Markdown',
        });
      }

      // Notification logga yozish
      await prisma.notification.create({
        data: {
          userId: filter.userId,
          carId: car.id,
        },
      });

      sentCount++;
    } catch (error) {
      // Foydalanuvchi botni bloklagan bo'lishi mumkin
      if (error.code === 403) {
        console.log(`⚠️ Foydalanuvchi ${telegramId} botni bloklagan`);
        await prisma.user.update({
          where: { telegramId: BigInt(telegramId) },
          data: { isActive: false },
        });
      } else {
        console.error(`❌ Xabar yuborishda xatolik (${telegramId}):`, error.message);
      }
    }
  }

  console.log(`📨 ${car.title} — ${sentCount} ta foydalanuvchiga yuborildi`);
  return sentCount;
}

/**
 * Mashina alert xabarini formatlash
 */
function formatCarAlert(car, filter) {
  let msg = `🚨 *Yangi taklif topildi!*\n\n`;
  msg += `🚗 *${car.title}*\n`;
  msg += `💰 Narx: *$${car.price.toLocaleString()}*`;

  // Narx filtriga nisbatan qanchalik past ekanligini ko'rsatish
  if (filter.maxPrice && car.price < filter.maxPrice) {
    const saved = filter.maxPrice - car.price;
    msg += ` _(filtrdan $${saved.toLocaleString()} arzon!)_`;
  }
  msg += '\n';

  if (car.year) msg += `📅 Yil: *${car.year}*\n`;
  if (car.city) msg += `📍 Shahar: ${car.city}\n`;
  if (car.mileage) msg += `🛣 Yurgan: ${car.mileage.toLocaleString()} km\n`;

  msg += `\n🔗 [E'lonni ko'rish](${car.url})`;

  if (car.source) {
    const sourceLabel = { olx: 'OLX', uzavto: 'UzAvto', avtoelon: 'Avtoelon' };
    msg += `\n📌 Manba: ${sourceLabel[car.source] || car.source}`;
  }

  return msg;
}

module.exports = {
  processNewCar,
  formatCarAlert,
};
