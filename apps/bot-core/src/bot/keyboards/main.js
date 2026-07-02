/**
 * CarBor Bot - Asosiy Keyboard
 * Foydalanuvchiga ko'rsatiladigan tugmalar
 */

const { Markup } = require('telegraf');

/**
 * Asosiy menyu keyboard
 * Bot /start bo'lgandan keyin ko'rinadi
 */
const mainKeyboard = Markup.keyboard([
  ['➕ Filtr qo\'shish', '📋 Filtrlarim'],
  ['💰 Balans', '⚙️ Sozlamalar'],
]).resize();

/**
 * Filtrni tasdiqlash keyboard
 */
const confirmKeyboard = Markup.keyboard([
  ['✅ Tasdiqlash', '❌ Bekor qilish'],
]).resize().oneTime();

/**
 * Orqaga qaytish keyboard
 */
const backKeyboard = Markup.keyboard([
  ['⬅️ Orqaga'],
]).resize().oneTime();

module.exports = {
  mainKeyboard,
  confirmKeyboard,
  backKeyboard,
};
