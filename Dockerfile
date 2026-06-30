FROM php:8.3-fpm-alpine AS builder
RUN apk add --no-cache git zip unzip libzip-dev oniguruma-dev \
    && docker-php-ext-install pdo_mysql mbstring zip opcache
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer
WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install --no-dev --optimize-autoloader --no-scripts --no-interaction

FROM php:8.3-fpm-alpine
RUN apk add --no-cache python3 py3-pip nginx \
    libzip-dev oniguruma-dev \
    && docker-php-ext-install pdo_mysql mbstring zip opcache

COPY --from=builder /app/vendor /app/vendor
WORKDIR /app
COPY . .

# venv evita PEP 668 (externally-managed-environment) en Alpine
RUN apk add --no-cache --virtual .ml-build-deps python3-dev gcc musl-dev g++ \
    && python3 -m venv /opt/venv \
    && /opt/venv/bin/pip install --upgrade pip \
    && if [ -f ml/requirements.txt ]; then /opt/venv/bin/pip install --no-cache-dir -r ml/requirements.txt; fi \
    && apk del .ml-build-deps \
    && chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/start.sh /start.sh
RUN chmod +x /start.sh

ENV ML_PYTHON_PATH=/opt/venv/bin/python
ENV ML_PYTHON_ARGS=

EXPOSE 80
CMD ["/start.sh"]
