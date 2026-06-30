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
    && docker-php-ext-install pdo_mysql mbstring zip opcache \
    && ln -sf python3 /usr/bin/python

COPY --from=builder /app/vendor /app/vendor
WORKDIR /app
COPY . .

RUN if [ -f ml/requirements.txt ]; then pip install --no-cache-dir -r ml/requirements.txt; fi \
    && chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

# SOLO un nginx.conf — NO default.conf
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/start.sh /start.sh
RUN chmod +x /start.sh

EXPOSE 80
CMD ["/start.sh"]