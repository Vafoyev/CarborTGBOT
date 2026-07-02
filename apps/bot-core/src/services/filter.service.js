/**
 * CarBor Bot - Filter Service
 * Filtrlar (qidiruv sozlamalari) bilan ishlash
 */

const prisma = require('../database');

/**
 * Yangi filtr yaratish
 * @param {Object} data - { telegramId, brand, model, maxPrice, minYear }
 */
async function createFilter(data) {
  const { telegramId, brand, model, maxPrice, minYear } = data;

  // Avval foydalanuvchini topamiz
  const user = await prisma.user.findUnique({
    where: { telegramId: BigInt(telegramId) },
  });

  if (!user) {
    throw new Error('Foydalanuvchi topilmadi. Avval /start bosing.');
  }

  const filter = await prisma.filter.create({
    data: {
      userId: user.id,
      brand,
      model: model || null,
      maxPrice: maxPrice || null,
      minYear: minYear || null,
    },
  });

  return filter;
}

/**
 * Foydalanuvchining barcha filtrlarini olish
 * @param {number} telegramId
 */
async function getFilters(telegramId) {
  const user = await prisma.user.findUnique({
    where: { telegramId: BigInt(telegramId) },
  });

  if (!user) return [];

  return prisma.filter.findMany({
    where: {
      userId: user.id,
      isActive: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Foydalanuvchining filtrlar sonini olish
 * @param {number} telegramId
 */
async function getFilterCount(telegramId) {
  const user = await prisma.user.findUnique({
    where: { telegramId: BigInt(telegramId) },
  });

  if (!user) return 0;

  return prisma.filter.count({
    where: {
      userId: user.id,
      isActive: true,
    },
  });
}

/**
 * Foydalanuvchining barcha filtrlarini o'chirish
 * @param {number} telegramId
 */
async function deleteAllFilters(telegramId) {
  const user = await prisma.user.findUnique({
    where: { telegramId: BigInt(telegramId) },
  });

  if (!user) return 0;

  const result = await prisma.filter.deleteMany({
    where: { userId: user.id },
  });

  return result.count;
}

/**
 * Berilgan mashina ma'lumotlariga mos keladigan filtrlarni topish
 * Bu — matching engine'ning asosiy qismi
 * @param {Object} carData - { brand, model, price, year }
 * @returns {Array} - Mos foydalanuvchilar ro'yxati (telegramId bilan)
 */
async function findMatchingFilters(carData) {
  const { brand, model, price, year } = carData;

  const where = {
    isActive: true,
    brand: { equals: brand, mode: 'insensitive' },
  };

  // Model filtri (agar filtrda model ko'rsatilgan bo'lsa)
  // model = null bo'lgan filtrlar barcha modellarga mos keladi

  const filters = await prisma.filter.findMany({
    where,
    include: {
      user: {
        select: {
          telegramId: true,
          isActive: true,
          isPremium: true,
        },
      },
    },
  });

  // Filtrlash (DB'da murakkab shart qo'yish qiyin, kodda qilamiz)
  const matched = filters.filter((f) => {
    // Foydalanuvchi aktiv bo'lishi kerak
    if (!f.user.isActive) return false;

    // Model tekshiruvi (filtrda model null bo'lsa — barchaga mos)
    if (f.model && model) {
      if (f.model.toLowerCase() !== model.toLowerCase()) return false;
    }

    // Narx tekshiruvi
    if (f.maxPrice && price > f.maxPrice) return false;
    if (f.minPrice && price < f.minPrice) return false;

    // Yil tekshiruvi
    if (f.minYear && year && year < f.minYear) return false;
    if (f.maxYear && year && year > f.maxYear) return false;

    return true;
  });

  return matched;
}

module.exports = {
  createFilter,
  getFilters,
  getFilterCount,
  deleteAllFilters,
  findMatchingFilters,
};
