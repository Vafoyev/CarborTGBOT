#!/bin/bash
# ============================================
# CarBor - Serverga Deploy Skripti
# VPS'ga SSH orqali ulanib ishga tushirish
#
# Ishlatish:
#   chmod +x deploy.sh
#   ./deploy.sh
# ============================================

echo "🚀 CarBor deploy boshlandi..."

# 1. Repo'ni pull qilish (yoki clone)
if [ -d "CarborTGBOT" ]; then
    echo "📥 Git pull..."
    cd CarborTGBOT && git pull origin main
else
    echo "📥 Git clone..."
    git clone https://github.com/Vafoyev/CarborTGBOT.git
    cd CarborTGBOT
fi

# 2. .env faylni tekshirish
if [ ! -f ".env" ]; then
    echo "⚠️  .env fayl topilmadi!"
    echo "   cp .env.example .env va token yozing"
    exit 1
fi

# 3. Docker Compose bilan ishga tushirish
echo "🐳 Docker Compose up..."
docker compose up -d --build

echo ""
echo "✅ Deploy tugadi!"
echo "📊 Status tekshirish: docker compose ps"
echo "📋 Bot loglar: docker compose logs -f bot"
echo "📋 Scraper loglar: docker compose logs -f scraper"
