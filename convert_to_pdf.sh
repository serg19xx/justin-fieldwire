#!/bin/bash

# Скрипт для конвертации HTML в PDF
# Использует встроенные возможности macOS

echo "🔄 Конвертация HTML в PDF..."

# Проверяем наличие HTML файла
if [ ! -f "TASK_DEPENDENCIES_CLIENT_GUIDE.html" ]; then
    echo "❌ HTML файл не найден!"
    exit 1
fi

# Открываем HTML файл в браузере для печати в PDF
echo "📄 Открываем HTML файл в браузере..."
echo "📋 Инструкции для создания PDF:"
echo "1. В браузере нажмите Cmd+P (печать)"
echo "2. Выберите 'Сохранить как PDF'"
echo "3. Настройте параметры:"
echo "   - Размер: A4"
echo "   - Поля: Стандартные"
echo "   - Масштаб: 100%"
echo "4. Сохраните как 'TASK_DEPENDENCIES_CLIENT_GUIDE.pdf'"

# Открываем файл в браузере по умолчанию
open "TASK_DEPENDENCIES_CLIENT_GUIDE.html"

echo "✅ HTML файл открыт в браузере"
echo "📝 Следуйте инструкциям выше для создания PDF"
