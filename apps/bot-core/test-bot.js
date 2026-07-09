// Minimal test - bot ishlayaptimi?
require('dotenv').config();
const { Telegraf } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.on('message', (ctx) => {
  console.log('📩 Xabar keldi:', ctx.message.text);
  ctx.reply('Salom! Bot ishlayapti ✅');
});

bot.launch({ dropPendingUpdates: true })
  .then(() => console.log('🚀 Test bot ishga tushdi!'))
  .catch((e) => console.error('❌ Xatolik:', e.message));

console.log('⏳ Kutilmoqda...');

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
