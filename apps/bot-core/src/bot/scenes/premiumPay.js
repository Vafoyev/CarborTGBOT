/**
 * CarBor Bot - "Premium to'lov" Wizard Scene
 * Foydalanuvchidan to'lov chekini (screenshot) qabul qiladi
 * va uni tasdiqlash uchun Adminga yuboradi.
 */

const { Scenes, Markup } = require('telegraf');
const { mainKeyboard } = require('../keyboards/main');
const config = require('../../config');

const premiumPayScene = new Scenes.WizardScene(
  'premium-pay',

  // ============================================
  // QADAM 1: Karta raqamini ko'rsatish va chek so'rash
  // ============================================
  async (ctx) => {
    const paymentInstructions =
      `💳 *Premium Obuna To'lovi*\n\n` +
      `Premium status afzalliklari:\n` +
      `⭐ 20 tagacha faol filtr (bepul foydalanuvchida 2 ta)\n` +
      `⭐ Yangi e'lonlar haqida eng tezkor bildirishnomalar\n` +
      `⭐ Sotuvchilarning telefon raqamlari\n\n` +
      `💵 Obuna narxi: *15,999 so'm / oy*\n\n` +
      `To'lovni amalga oshirish uchun karta ma'lumotlari:\n` +
      `📌 Karta: *8600 1402 3456 7890*\n` +
      `👤 Ega: *ISOBEK VAFOYEV*\n` +
      `🏦 Tizim: *UZCARD / HUMO*\n\n` +
      `📥 *To'lovdan so'ng, to'lov cheki (screenshot) rasmini shu yerga yuboring:*`;

    await ctx.reply(paymentInstructions, {
      parse_mode: 'Markdown',
      ...Markup.keyboard([['⬅️ Bekor qilish']]).resize().oneTime(),
    });

    return ctx.wizard.next();
  },

  // ============================================
  // QADAM 2: Chek rasmini qabul qilish va adminga yuborish
  // ============================================
  async (ctx) => {
    // 1. Bekor qilishni tekshirish
    const text = ctx.message?.text;
    if (text === '⬅️ Bekor qilish') {
      await ctx.reply('❌ To\'lov bekor qilindi.', mainKeyboard);
      return ctx.scene.leave();
    }

    // 2. Rasm yuborilganligini tekshirish
    const photos = ctx.message?.photo;
    if (!photos || photos.length === 0) {
      await ctx.reply(
        '⚠️ Iltimos, faqat to\'lov cheki rasmini (screenshot) yuboring.\n' +
        'Agar bekor qilmoqchi bo\'lsangiz, "Bekor qilish" tugmasini bosing.'
      );
      return; // qayta shu qadamda qoladi
    }

    // Eng katta rasmni olish
    const photo = photos[photos.length - 1];
    const user = ctx.from;
    const adminId = config.bot.adminId;

    if (!adminId) {
      console.error('❌ BOT_ADMIN_ID sozlanmagan!');
      await ctx.reply('❌ Tizimda xatolik. Admin sozlanmagan. Iltimos keyinroq urinib ko\'ring.', mainKeyboard);
      return ctx.scene.leave();
    }

    try {
      // Adminga chek rasmini yuborish
      const adminCaption =
        `💰 *Yangi Premium To'lov Cheki!*\n\n` +
        `👤 Foydalanuvchi: *${user.first_name} ${user.last_name || ''}*\n` +
        `🆔 Telegram ID: \`${user.id}\`\n` +
        `🔗 Username: ${user.username ? '@' + user.username : 'Mavjud emas'}\n\n` +
        `Iltimos, to'lovni tekshirib, quyidagi tugmalar orqali tasdiqlang:`;

      const adminMarkup = Markup.inlineKeyboard([
        [
          Markup.button.callback('✅ Tasdiqlash', `admin_approve_pay:${user.id}`),
          Markup.button.callback('❌ Rad etish', `admin_reject_pay:${user.id}`),
        ],
      ]);

      await ctx.telegram.sendPhoto(adminId.toString(), photo.file_id, {
        caption: adminCaption,
        parse_mode: 'Markdown',
        ...adminMarkup,
      });

      // Foydalanuvchiga muvaffaqiyat xabari
      await ctx.reply(
        '✅ *To\'lov cheki qabul qilindi!*\n\n' +
        'Tez orada admin to\'lovni tekshirib, premium statusni faollashtiradi (odatda 5-15 daqiqa ichida). ✨',
        mainKeyboard
      );
    } catch (error) {
      console.error('To\'lov chekini adminga yuborishda xatolik:', error);
      await ctx.reply('❌ To\'lov chekini yuborishda xatolik yuz berdi. Iltimos qaytadan urinib ko\'ring.', mainKeyboard);
    }

    return ctx.scene.leave();
  }
);

// Sahnadan chiqish interruptors (ko'rsatmalar yoki komandalar bosilganda)
const mainButtons = [
  '➕ Filtr qo\'shish',
  '📋 Filtrlarim',
  '💰 Balans',
  '⚙️ Sozlamalar',
  '⬅️ Bekor qilish'
];
mainButtons.forEach((button) => {
  premiumPayScene.hears(button, async (ctx, next) => {
    await ctx.scene.leave();
    return next();
  });
});

const commands = ['start', 'help', 'myfilters', 'deletefilters'];
commands.forEach((cmd) => {
  premiumPayScene.command(cmd, async (ctx, next) => {
    await ctx.scene.leave();
    return next();
  });
});

// Sahnani tugatish
premiumPayScene.command('cancel', async (ctx) => {
  await ctx.reply('❌ To\'lov bekor qilindi.', mainKeyboard);
  return ctx.scene.leave();
});

module.exports = { premiumPayScene };
