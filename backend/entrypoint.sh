#!/bin/sh

# Выполняем миграции Django
python manage.py makemigrations --noinput
python manage.py migrate --noinput

# Собираем статические файлы
python manage.py collectstatic --noinput --clear

# Запускаем Gunicorn
gunicorn core.wsgi:application --bind 0.0.0.0:8000 --timeout 600
