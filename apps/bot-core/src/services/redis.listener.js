/**
 * CarBor Bot - Redis Listener
 * Python Scraper'dan kelgan yangi mashina ma'lumotlarini qabul qiladi
 *
 * Ishlash tartibi:
 * 1. Python Scraper mashina topadi
 * 2. Scraper Redis'ga "new_car" kanaliga publish qiladi
 * 3. Shu listener xabarni oladi va processNewCar() ga uzatadi
 */

const Redis = require('ioredis');
const config = require('../config');
const { processNewCar } = require('./matching.service');

// Redis kanallar
const CHANNELS = {
  NEW_CAR: 'carbor:new_car',       // Yangi mashina topildi
  SCRAPER_STATUS: 'carbor:status',  // Scraper holati
};

/**
 * Redis listener'ni sozlash va ishga tushirish
 * @param {Object} bot - Telegraf bot instance
 */
function setupRedisListener(bot) {
  let subscriber;

  try {
    subscriber = new Redis(config.redis.url, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      retryStrategy(times) {
        if (times > 3) {
          console.warn('⚠️ Redis ulanmadi. Bot ishlaydi, scraper alertlari keyinroq.');
          return null;
        }
        return Math.min(times * 1000, 5000);
      },
    });

    subscriber.connect().catch(() => {
      console.warn('⚠️ Redis mavjud emas. Bot Redis\'siz ishlaydi.');
    });

    // Kanallarga obuna bo'lish
    subscriber.subscribe(CHANNELS.NEW_CAR, CHANNELS.SCRAPER_STATUS, (err, count) => {
      if (err) {
        console.error('❌ Redis subscribe xatolik:', err);
        return;
      }
      console.log(`📡 Redis: ${count} ta kanalga ulandi`);
    });

    // Xabar kelganda
    subscriber.on('message', async (channel, message) => {
      try {
        const data = JSON.parse(message);

        if (channel === CHANNELS.NEW_CAR) {
          // Yangi mashina keldi — matching engine'ni ishga tushirish
          await processNewCar(bot, data);
        }

        if (channel === CHANNELS.SCRAPER_STATUS) {
          console.log(`🔄 Scraper status: ${data.status} | ${data.message || ''}`);
        }
      } catch (error) {
        console.error('❌ Redis xabarni qayta ishlashda xatolik:', error);
      }
    });

    // Ulanish hodisalari
    subscriber.on('connect', () => {
      console.log('✅ Redis ulandi (Subscriber)');
    });

    subscriber.on('error', (err) => {
      console.error('❌ Redis xatolik:', err.message);
    });
  } catch (error) {
    console.warn('⚠️ Redis ulanmadi. Bot ishlaydi, lekin scraper alertlari kelmaydi.');
    console.warn('💡 Redis ishga tushirish: docker-compose up redis');
  }
}

module.exports = { setupRedisListener, CHANNELS };
