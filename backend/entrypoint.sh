#!/bin/sh

# Ждём готовности базы данных
echo "Waiting for database..."
python -c "
import os, time, psycopg2
for i in range(30):
    try:
        psycopg2.connect(
            dbname=os.getenv('POSTGRES_DB'),
            user=os.getenv('POSTGRES_USER'),
            password=os.getenv('POSTGRES_PASSWORD'),
            host=os.getenv('POSTGRES_HOST'),
            port=int(os.getenv('POSTGRES_PORT', 5432))
        ).close()
        print('Database is ready')
        break
    except psycopg2.OperationalError:
        print(f'Attempt {i+1}/30, retrying...')
        time.sleep(1)
else:
    print('Database not available after 30 attempts')
    raise SystemExit(1)
"

# Применяем миграции
python manage.py migrate --noinput

# Собираем статические файлы
python manage.py collectstatic --noinput --clear

# Запускаем Gunicorn
WORKERS=$(( 2 * $(nproc) + 1 ))
gunicorn core.wsgi:application --bind 0.0.0.0:8000 --workers $WORKERS --timeout 600
