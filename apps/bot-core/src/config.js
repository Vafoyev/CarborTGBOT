/**
 * CarBor Bot - Konfiguratsiya
 * Barcha muhit o'zgaruvchilari shu yerdan boshqariladi
 */

require('dotenv').config();

const config = {
  // Telegram Bot
  bot: {
    token: process.env.BOT_TOKEN,
    adminId: process.env.BOT_ADMIN_ID,
  },

  // PostgreSQL (Prisma orqali)
  database: {
    url: process.env.DATABASE_URL,
  },

  // Redis (Scraper <-> Bot aloqasi)
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  // Ilova sozlamalari
  app: {
    maxFiltersPerUser: 2,        // Bepul foydalanuvchi uchun (2 ta)
    maxFiltersPremium: 20,       // Premium foydalanuvchi uchun (20 ta)
    matchingIntervalMs: 30000,   // Har 30 sekundda matching tekshiruvi
  },
};

// Muhim o'zgaruvchilarni tekshirish
function validateConfig() {
  const required = ['BOT_TOKEN'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error(`❌ Muhit o'zgaruvchilari topilmadi: ${missing.join(', ')}`);
    console.error('💡 .env.example faylini .env ga nusxalab, to\'ldiring');
    process.exit(1);
  }
}

validateConfig();

module.exports = config;
