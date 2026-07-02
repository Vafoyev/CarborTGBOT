/**
 * CarBor Telegram Bot - Entry Point
 * Uzbekiston avtomobil bozori uchun Market Arbitrage System
 *
 * Arxitektura:
 * - Telegraf.js: Bot framework
 * - Prisma ORM: PostgreSQL bilan ishlash
 * - Redis: Scraper bilan real-time aloqa
 */

const { Telegraf, Scenes, session } = require('telegraf');
const config = require('./config');
const prisma = require('./database');
const { setupCommands } = require('./bot/commands/start');
const { mainKeyboard } = require('./bot/keyboards/main');
const { addFilterScene } = require('./bot/scenes/addFilter');
const { setupRedisListener } = require('./services/redis.listener');

// Bot yaratish
const bot = new Telegraf(config.bot.token);

// ============================================
// MIDDLEWARE & SESSION
// ============================================

// Session (scene wizard uchun kerak)
bot.use(session());

// Scene manager (Add Filter wizard)
const stage = new Scenes.Stage([addFilterScene]);
bot.use(stage.middleware());

// ============================================
// COMMANDS & HANDLERS
// ============================================

// /start komandasi va asosiy menyular
setupCommands(bot);

// ============================================
// CALLBACK QUERY HANDLERS (Inline buttons)
// ============================================

// "Filtrlarim" tugmasi bosilganda
bot.hears('📋 Filtrlarim', async (ctx) => {
  const { getFilters } = require('./services/filter.service');
  try {
    const filters = await getFilters(ctx.from.id);

    if (filters.length === 0) {
      return ctx.reply(
        '📭 Sizda hali filtrlar yo\'q.\n\n"➕ Filtr qo\'shish" tugmasini bosing va qidiruv sozlamangizni kiriting.',
      );
    }

    let message = '📋 *Sizning filtrlaringiz:*\n\n';
    filters.forEach((f, i) => {
      message += `${i + 1}. *${f.brand}*`;
      if (f.model) message += ` ${f.model}`;
      if (f.maxPrice) message += ` | Max: $${f.maxPrice.toLocaleString()}`;
      if (f.minYear) message += ` | ${f.minYear}+`;
      message += '\n';
    });

    message += `\n📊 Jami: ${filters.length} ta filtr`;
    await ctx.reply(message, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Filtrlarni olishda xatolik:', error);
    await ctx.reply('❌ Xatolik yuz berdi. Qaytadan urinib ko\'ring.');
  }
});

// "Filtr qo'shish" tugmasi bosilganda
bot.hears('➕ Filtr qo\'shish', (ctx) => {
  ctx.scene.enter('add-filter');
});

// "💰 Balans" tugmasi
bot.hears('💰 Balans', async (ctx) => {
  const { getUserBalance } = require('./services/user.service');
  try {
    const user = await getUserBalance(ctx.from.id);
    const status = user.isPremium ? '⭐ Premium' : '👤 Oddiy';

    await ctx.reply(
      `💰 *Sizning hisobingiz:*\n\n` +
        `Balans: *${user.balance.toLocaleString()} so'm*\n` +
        `Status: ${status}\n` +
        `Filtrlar: ${user._count.filters} ta\n\n` +
        `💡 Premium bo'lsangiz 20 tagacha filtr qo'shishingiz mumkin!`,
      { parse_mode: 'Markdown' },
    );
  } catch (error) {
    console.error('Balansni olishda xatolik:', error);
    await ctx.reply('❌ Xatolik yuz berdi.');
  }
});

// "⚙️ Sozlamalar" tugmasi
bot.hears('⚙️ Sozlamalar', async (ctx) => {
  await ctx.reply(
    '⚙️ *Sozlamalar:*\n\n' +
      '/deletefilters - Barcha filtrlarni o\'chirish\n' +
      '/premium - Premium haqida ma\'lumot\n' +
      '/help - Yordam',
    { parse_mode: 'Markdown' },
  );
});

// ============================================
// ERROR HANDLING
// ============================================

bot.catch((err, ctx) => {
  console.error(`❌ Bot xatolik [${ctx.updateType}]:`, err);
  ctx.reply('⚠️ Kutilmagan xatolik yuz berdi. Iltimos qaytadan urinib ko\'ring.').catch(() => {});
});

// ============================================
// LAUNCH
// ============================================

async function launch() {
  try {
    // Database ulanishni tekshirish
    await prisma.$connect();
    console.log('✅ PostgreSQL ulandi');

    // Redis listener (Scraper qo'shilganda yoqiladi)
    // setupRedisListener(bot);
    console.log('ℹ️  Redis listener o\'chirilgan (scraper keyinroq qo\'shiladi)');

    // Botni ishga tushirish
    console.log('⏳ Telegram API ga ulanilmoqda...');
    bot.launch({
      dropPendingUpdates: true,
    }).then(() => {
      console.log('🚀 CarBor Bot ishga tushdi!');
      console.log(`🤖 Bot: @${bot.botInfo?.username || 'unknown'}`);
      console.log('💡 Telegram da /start yozing: https://t.me/' + (bot.botInfo?.username || 'moshintoparbot'));
    });
    console.log('✅ Bot launch boshlandi — Telegram da /start yozing!');
  } catch (error) {
    console.error('❌ Botni ishga tushirishda xatolik:', error.message || error);
    process.exit(1);
  }
}

// Graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

launch();
