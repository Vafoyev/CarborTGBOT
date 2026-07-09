/**
 * CarBor Bot - /start va /help komandalari
 * Foydalanuvchini ro'yxatga oladi va asosiy menyuni ko'rsatadi
 */

const { mainKeyboard } = require('../keyboards/main');
const { registerUser } = require('../../services/user.service');

/**
 * Bot komandalarini sozlash
 */
function setupCommands(bot) {
  // /start - Foydalanuvchini ro'yxatga olish
  bot.start(async (ctx) => {
    try {
      const { id, first_name, last_name, username } = ctx.from;

      // Foydalanuvchini bazaga saqlash (yoki mavjudini yangilash)
      await registerUser({
        telegramId: id,
        firstName: first_name,
        lastName: last_name,
        username: username,
      });

      const welcomeMessage =
        `🚗 *CarBor ga xush kelibsiz, ${first_name}!*\n\n` +
        `Men sizga Uzbekiston avtomobil bozoridan eng yaxshi takliflarni topib beraman.\n\n` +
        `📌 *Qanday ishlaydi:*\n` +
        `1️⃣ "➕ Filtr qo'shish" — qidiruv sozlamangizni kiriting\n` +
        `2️⃣ Men bozorni 24/7 kuzatib turaman\n` +
        `3️⃣ Sizga mos mashina chiqqanda — darhol xabar beraman!\n\n` +
        `⚡ Boshqa hech kim bilmasdanoq, eng yaxshi narxlarni birinchi bo'lib ko'rasiz.\n\n` +
        `👇 Boshlash uchun pastdagi tugmalardan foydalaning:`;

      await ctx.reply(welcomeMessage, {
        parse_mode: 'Markdown',
        ...mainKeyboard,
      });
    } catch (error) {
      console.error('/start xatolik:', error);
      await ctx.reply('❌ Xatolik yuz berdi. /start ni qaytadan bosing.');
    }
  });

  // /help - Yordam
  bot.help(async (ctx) => {
    const helpMessage =
      `ℹ️ *CarBor Bot — Yordam*\n\n` +
      `*Asosiy buyruqlar:*\n` +
      `/start — Botni qayta ishga tushirish\n` +
      `/help — Shu yordam xabari\n` +
      `/myfilters — Filtrlaringizni ko'rish\n` +
      `/deletefilters — Barcha filtrlarni o'chirish\n\n` +
      `*Qanday ishlaydi:*\n` +
      `Bot OLX, Avtoelon va boshqa saytlarni doimiy kuzatib turadi. ` +
      `Sizning filtrlaringizga mos mashina chiqqanda, bir necha soniya ichida xabar olasiz.\n\n` +
      `*Premium afzalliklari:*\n` +
      `⭐ 20 tagacha filtr (oddiy: 2 ta)\n` +
      `⭐ Tezkor bildirishnomalar\n` +
      `⭐ Sotuvchi telefon raqami\n\n` +
      `📩 Savol va takliflar: @carbor_support`;

    await ctx.reply(helpMessage, { parse_mode: 'Markdown' });
  });

  // /myfilters - Filtrlarni ko'rish (shortcut)
  bot.command('myfilters', async (ctx) => {
    const { getFilters } = require('../../services/filter.service');
    try {
      const filters = await getFilters(ctx.from.id);

      if (filters.length === 0) {
        return ctx.reply('📭 Sizda hali filtrlar yo\'q. "➕ Filtr qo\'shish" tugmasini bosing.');
      }

      let message = '📋 *Sizning filtrlaringiz:*\n\n';
      filters.forEach((f, i) => {
        message += `${i + 1}. *${f.brand}*`;
        if (f.model) message += ` ${f.model}`;
        if (f.maxPrice) message += ` | Max: $${f.maxPrice.toLocaleString()}`;
        if (f.minYear) message += ` | ${f.minYear}+ yil`;
        message += '\n';
      });

      await ctx.reply(message, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('/myfilters xatolik:', error);
      await ctx.reply('❌ Xatolik yuz berdi.');
    }
  });

  // /deletefilters - Barcha filtrlarni o'chirish
  bot.command('deletefilters', async (ctx) => {
    const { deleteAllFilters } = require('../../services/filter.service');
    try {
      const count = await deleteAllFilters(ctx.from.id);
      await ctx.reply(`🗑 ${count} ta filtr o'chirildi.`, mainKeyboard);
    } catch (error) {
      console.error('/deletefilters xatolik:', error);
      await ctx.reply('❌ Xatolik yuz berdi.');
    }
  });
}

module.exports = { setupCommands };
