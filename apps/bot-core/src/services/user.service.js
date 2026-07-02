/**
 * CarBor Bot - User Service
 * Foydalanuvchilar bilan bog'liq barcha biznes logika
 */

const prisma = require('../database');

/**
 * Foydalanuvchini ro'yxatga olish yoki mavjudini yangilash
 * @param {Object} data - { telegramId, firstName, lastName, username }
 */
async function registerUser(data) {
  const { telegramId, firstName, lastName, username } = data;

  const user = await prisma.user.upsert({
    where: { telegramId: BigInt(telegramId) },
    update: {
      firstName,
      lastName,
      username,
    },
    create: {
      telegramId: BigInt(telegramId),
      firstName,
      lastName,
      username,
    },
  });

  return user;
}

/**
 * Foydalanuvchi balansini olish
 * @param {number} telegramId
 */
async function getUserBalance(telegramId) {
  const user = await prisma.user.findUnique({
    where: { telegramId: BigInt(telegramId) },
    select: {
      balance: true,
      isPremium: true,
      _count: {
        select: { filters: true },
      },
    },
  });

  if (!user) {
    throw new Error('Foydalanuvchi topilmadi');
  }

  return user;
}

/**
 * Foydalanuvchini telegramId bo'yicha topish
 * @param {number} telegramId
 */
async function findUserByTelegramId(telegramId) {
  return prisma.user.findUnique({
    where: { telegramId: BigInt(telegramId) },
  });
}

/**
 * Premium statusni yangilash
 * @param {number} telegramId
 * @param {boolean} isPremium
 */
async function setPremiumStatus(telegramId, isPremium) {
  return prisma.user.update({
    where: { telegramId: BigInt(telegramId) },
    data: { isPremium },
  });
}

module.exports = {
  registerUser,
  getUserBalance,
  findUserByTelegramId,
  setPremiumStatus,
};
