#!/bin/bash
# CarBor Bot - Tezkor Setup
# Bitta buyruq bilan hammasi ishga tushadi

echo "🚀 CarBor Bot Setup boshlandi..."

# 1. Node.js tekshirish / o'rnatish
if ! command -v node &> /dev/null; then
    echo "📦 Node.js o'rnatilmoqda..."
    brew install node
fi

echo "✅ Node.js: $(node --version)"

# 2. Bot papkasiga kirish
cd "$(dirname "$0")/apps/bot-core" || exit 1

# 3. npm install
echo "📦 Dependency'lar o'rnatilmoqda..."
npm install

# 4. Prisma generate + DB push
echo "🗄️ Database tayyorlanmoqda..."
npx prisma generate
npx prisma db push

# 5. Bot ishga tushirish
echo ""
echo "✅ Hammasi tayyor!"
echo "🤖 Bot ishga tushmoqda..."
echo ""
node src/index.js
