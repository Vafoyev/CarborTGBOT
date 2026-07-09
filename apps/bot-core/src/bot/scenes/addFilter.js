/**
 * CarBor Bot - "Filtr qo'shish" Wizard Scene
 * Foydalanuvchidan qadam-baqadam ma'lumot oladi:
 * 1. Brand (Chevrolet, Hyundai, Kia...)
 * 2. Model (Gentra, Cobalt, Malibu...)
 * 3. Maksimal narx (USD)
 * 4. Minimal yil (2018, 2020...)
 * 5. Tasdiqlash
 */

const { Scenes, Markup } = require('telegraf');
const { mainKeyboard } = require('../keyboards/main');
const { createFilter, getFilterCount } = require('../../services/filter.service');
const config = require('../../config');

// O'zbekistondagi eng mashhur brendlar
const POPULAR_BRANDS = [
  'Chevrolet', 'Hyundai', 'Kia', 'Toyota',
  'Daewoo', 'BYD', 'Haval', 'Chery',
  'Volkswagen', 'Mercedes', 'BMW', 'Audi',
];

// Brand bo'yicha modellar
const BRAND_MODELS = {
  Chevrolet: ['Gentra', 'Cobalt', 'Malibu', 'Tracker', 'Equinox', 'Onix', 'Spark', 'Nexia 3', 'Damas', 'Labo'],
  Hyundai: ['Sonata', 'Tucson', 'Santa Fe', 'Accent', 'Elantra', 'Creta'],
  Kia: ['K5', 'Sportage', 'Seltos', 'Cerato', 'Carnival', 'Sorento'],
  Toyota: ['Camry', 'Corolla', 'RAV4', 'Land Cruiser', 'Hilux', 'Prado'],
  Daewoo: ['Matiz', 'Nexia', 'Gentra', 'Lacetti', 'Cobalt'],
  BYD: ['Song Plus', 'Han', 'Tang', 'Seal', 'Dolphin', 'Atto 3'],
  Haval: ['Jolion', 'Dargo', 'H6', 'F7'],
  Chery: ['Tiggo 7 Pro', 'Tiggo 4 Pro', 'Tiggo 8 Pro', 'Arrizo 8'],
};

const addFilterScene = new Scenes.WizardScene(
  'add-filter',

  // ============================================
  // QADAM 1: Brand tanlash
  // ============================================
  async (ctx) => {
    console.log(`🎬 [add-filter] Qadam 1 boshlandi. User: ${ctx.from.id}`);
    try {
      // Filtr limitini tekshirish
      const count = await getFilterCount(ctx.from.id);
      const maxFilters = config.app.maxFiltersPerUser;
      console.log(`🎬 [add-filter] Limit tekshiruvi: count=${count}, maxFilters=${maxFilters}`);

      if (count >= maxFilters) {
        console.log(`🎬 [add-filter] Limit to'lgan. Sahna tark etilmoqda.`);
        await ctx.reply(
          `⚠️ Siz maksimal ${maxFilters} ta filtr qo'shgansiz.\n\n` +
            `Premium obuna bo'lsangiz ${config.app.maxFiltersPremium} tagacha filtr qo'shishingiz mumkin!\n` +
            `/premium — batafsil ma'lumot`,
          mainKeyboard,
        );
        return ctx.scene.leave();
      }

      // Brand tanlash tugmalari
      const brandButtons = [];
      for (let i = 0; i < POPULAR_BRANDS.length; i += 3) {
        brandButtons.push(POPULAR_BRANDS.slice(i, i + 3));
      }
      brandButtons.push(['⬅️ Bekor qilish']);

      console.log(`🎬 [add-filter] Tugmalar tayyorlandi, javob yuborilmoqda.`);
      await ctx.reply(
        '🚗 *1-Qadam: Avtomobil brendini tanlang*\n\n' +
          'Pastdagi tugmalardan birini tanlang yoki o\'zingiz yozing:',
        {
          parse_mode: 'Markdown',
          ...Markup.keyboard(brandButtons).resize().oneTime(),
        },
      );

      console.log(`🎬 [add-filter] Keyingi qadamga o'tildi.`);
      return ctx.wizard.next();
    } catch (err) {
      console.error('❌ [add-filter] Qadam 1 xatolik:', err);
      await ctx.reply('❌ Xatolik yuz berdi. Qaytadan urinib ko\'ring.', mainKeyboard);
      return ctx.scene.leave();
    }
  },

  // ============================================
  // QADAM 2: Model tanlash
  // ============================================
  async (ctx) => {
    const text = ctx.message?.text;

    if (!text || text === '⬅️ Bekor qilish') {
      await ctx.reply('❌ Filtr qo\'shish bekor qilindi.', mainKeyboard);
      return ctx.scene.leave();
    }

    // Brandni saqlash
    ctx.wizard.state.brand = text.trim();

    // Mos modellarni ko'rsatish
    const models = BRAND_MODELS[text.trim()] || [];
    const modelButtons = [];

    if (models.length > 0) {
      for (let i = 0; i < models.length; i += 3) {
        modelButtons.push(models.slice(i, i + 3));
      }
    }
    modelButtons.push(['🔄 Barchasi (model farqi yo\'q)']);
    modelButtons.push(['⬅️ Bekor qilish']);

    await ctx.reply(
      `🚗 *2-Qadam: ${text} modelini tanlang*\n\n` +
        'Modelni tanlang yoki o\'zingiz yozing.\n' +
        '"Barchasi" ni tanlasangiz — barcha modellar kuzatiladi.',
      {
        parse_mode: 'Markdown',
        ...Markup.keyboard(modelButtons).resize().oneTime(),
      },
    );

    return ctx.wizard.next();
  },

  // ============================================
  // QADAM 3: Maksimal narx
  // ============================================
  async (ctx) => {
    const text = ctx.message?.text;

    if (!text || text === '⬅️ Bekor qilish') {
      await ctx.reply('❌ Filtr qo\'shish bekor qilindi.', mainKeyboard);
      return ctx.scene.leave();
    }

    // Modelni saqlash
    if (text === '🔄 Barchasi (model farqi yo\'q)') {
      ctx.wizard.state.model = null;
    } else {
      ctx.wizard.state.model = text.trim();
    }

    // Narx tugmalari
    const priceButtons = [
      ['$5,000', '$8,000', '$10,000'],
      ['$13,000', '$15,000', '$20,000'],
      ['$25,000', '$35,000', '$50,000'],
      ['🔄 Farqi yo\'q (limitsiz)'],
      ['⬅️ Bekor qilish'],
    ];

    await ctx.reply(
      '💰 *3-Qadam: Maksimal narxni belgilang (USD)*\n\n' +
        'Tugmalardan tanlang yoki o\'zingiz yozing (masalan: 12000):',
      {
        parse_mode: 'Markdown',
        ...Markup.keyboard(priceButtons).resize().oneTime(),
      },
    );

    return ctx.wizard.next();
  },

  // ============================================
  // QADAM 4: Minimal yil
  // ============================================
  async (ctx) => {
    const text = ctx.message?.text;

    if (!text || text === '⬅️ Bekor qilish') {
      await ctx.reply('❌ Filtr qo\'shish bekor qilindi.', mainKeyboard);
      return ctx.scene.leave();
    }

    // Narxni saqlash
    if (text === '🔄 Farqi yo\'q (limitsiz)') {
      ctx.wizard.state.maxPrice = null;
    } else {
      // "$13,000" -> 13000
      const price = parseInt(text.replace(/[$,\s]/g, ''), 10);
      if (isNaN(price) || price <= 0) {
        await ctx.reply('⚠️ Noto\'g\'ri narx! Raqam kiriting (masalan: 15000):');
        return; // Qaytadan shu qadamda qoladi
      }
      ctx.wizard.state.maxPrice = price;
    }

    // Yil tugmalari
    const currentYear = new Date().getFullYear();
    const yearButtons = [
      [`${currentYear}`, `${currentYear - 1}`, `${currentYear - 2}`],
      [`${currentYear - 3}`, `${currentYear - 5}`, `${currentYear - 8}`],
      ['🔄 Farqi yo\'q (barcha yillar)'],
      ['⬅️ Bekor qilish'],
    ];

    await ctx.reply(
      '📅 *4-Qadam: Minimal ishlab chiqarilgan yilni tanlang*\n\n' +
        'Masalan 2022 tanlasangiz — faqat 2022 va undan yangi mashinalar ko\'rsatiladi:',
      {
        parse_mode: 'Markdown',
        ...Markup.keyboard(yearButtons).resize().oneTime(),
      },
    );

    return ctx.wizard.next();
  },

  // ============================================
  // QADAM 5: Tasdiqlash
  // ============================================
  async (ctx) => {
    const text = ctx.message?.text;

    if (!text || text === '⬅️ Bekor qilish') {
      await ctx.reply('❌ Filtr qo\'shish bekor qilindi.', mainKeyboard);
      return ctx.scene.leave();
    }

    // Yilni saqlash
    if (text === '🔄 Farqi yo\'q (barcha yillar)') {
      ctx.wizard.state.minYear = null;
    } else {
      const year = parseInt(text, 10);
      if (isNaN(year) || year < 1990 || year > new Date().getFullYear() + 1) {
        await ctx.reply('⚠️ Noto\'g\'ri yil! 1990 dan hozirgi yilgacha kiriting:');
        return;
      }
      ctx.wizard.state.minYear = year;
    }

    // Filtr xulosasini ko'rsatish
    const { brand, model, maxPrice, minYear } = ctx.wizard.state;

    let summary = '📝 *Filtr xulosasi:*\n\n';
    summary += `🚗 Brand: *${brand}*\n`;
    summary += `📌 Model: *${model || 'Barchasi'}*\n`;
    summary += `💰 Max narx: *${maxPrice ? '$' + maxPrice.toLocaleString() : 'Limitsiz'}*\n`;
    summary += `📅 Min yil: *${minYear || 'Farqi yo\'q'}*\n\n`;
    summary += 'Tasdiqlaysizmi?';

    await ctx.reply(summary, {
      parse_mode: 'Markdown',
      ...Markup.keyboard([
        ['✅ Tasdiqlash', '❌ Bekor qilish'],
      ]).resize().oneTime(),
    });

    return ctx.wizard.next();
  },

  // ============================================
  // QADAM 6: Saqlash
  // ============================================
  async (ctx) => {
    const text = ctx.message?.text;

    if (text === '✅ Tasdiqlash') {
      try {
        const { brand, model, maxPrice, minYear } = ctx.wizard.state;

        await createFilter({
          telegramId: ctx.from.id,
          brand,
          model,
          maxPrice,
          minYear,
        });

        await ctx.reply(
          '✅ *Filtr muvaffaqiyatli qo\'shildi!*\n\n' +
            `🔍 Men endi *${brand}${model ? ' ' + model : ''}* ni kuzatib turaman.\n` +
            'Mos mashina topilganda — sizga darhol xabar beraman! 🚀',
          {
            parse_mode: 'Markdown',
            ...mainKeyboard,
          },
        );
      } catch (error) {
        console.error('Filtr saqlashda xatolik:', error);
        await ctx.reply('❌ Filtrni saqlashda xatolik yuz berdi. Qaytadan urinib ko\'ring.', mainKeyboard);
      }
    } else {
      await ctx.reply('❌ Filtr qo\'shish bekor qilindi.', mainKeyboard);
    }

    return ctx.scene.leave();
  },
);

// Scene'dan tashqariga chiqish (har qanday holatda)
addFilterScene.command('cancel', async (ctx) => {
  await ctx.reply('❌ Filtr qo\'shish bekor qilindi.', mainKeyboard);
  return ctx.scene.leave();
});

// Asosiy menyu tugmalari bosilganda sahnadan chiqish
const mainButtons = [
  '📋 Filtrlarim',
  '💰 Balans',
  '⚙️ Sozlamalar',
  '⬅️ Bekor qilish'
];
mainButtons.forEach((button) => {
  addFilterScene.hears(button, async (ctx, next) => {
    await ctx.scene.leave();
    if (button === '⬅️ Bekor qilish') {
      return ctx.reply('❌ Filtr qo\'shish bekor qilindi.', mainKeyboard);
    }
    return next(); // outer handlers match the hears
  });
});

// Asosiy komandalar yozilganda sahnadan chiqish
const commands = ['start', 'help', 'myfilters', 'deletefilters'];
commands.forEach((cmd) => {
  addFilterScene.command(cmd, async (ctx, next) => {
    await ctx.scene.leave();
    return next(); // outer handlers match the command
  });
});

module.exports = { addFilterScene };

