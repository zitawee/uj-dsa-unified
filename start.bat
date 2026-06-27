@echo off
cd /d "%~dp0"
echo ══════════════════════════════════════
echo  الجامعة الأردنية - عمادة شؤون الطلبة
echo ══════════════════════════════════════
if not exist "node_modules\express" (
    echo جاري تثبيت المتطلبات...
    npm install
)
node server.js
pause
