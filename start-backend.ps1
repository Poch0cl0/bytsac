# Inicia el API de BYTSAC en el puerto 8001 (el 8000 suele estar ocupado por otros proyectos).
Set-Location $PSScriptRoot
php artisan config:clear
php artisan serve --port=8001 --host=127.0.0.1
