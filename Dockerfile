# ---- Etapa de construcción ----
    FROM php:8.3-fpm-alpine AS builder

    RUN apk add --no-cache git zip unzip libzip-dev libpng-dev oniguruma-dev \
        && docker-php-ext-install pdo_mysql mbstring zip opcache
    
    COPY --from=composer:latest /usr/bin/composer /usr/bin/composer
    
    WORKDIR /app
    COPY composer.json composer.lock ./
    RUN composer install --no-dev --optimize-autoloader --no-scripts --no-interaction
    
    # ---- Imagen final ----
    FROM php:8.3-fpm-alpine
    
    # Instalar Python y Nginx
    RUN apk add --no-cache python3 py3-pip nginx \
        && ln -sf python3 /usr/bin/python \
        && ln -sf pip3 /usr/bin/pip
    
    # Instalar extensiones de PHP
    RUN apk add --no-cache libzip-dev libpng-dev oniguruma-dev \
        && docker-php-ext-install pdo_mysql mbstring zip opcache
    
    # Copiar Composer y vendor desde la etapa builder
    COPY --from=builder /usr/bin/composer /usr/bin/composer
    COPY --from=builder /app/vendor /app/vendor
    COPY --from=builder /app/composer.json /app/composer.json
    COPY --from=builder /app/composer.lock /app/composer.lock
    
    # Copiar código de la aplicación
    WORKDIR /app
    COPY . .
    
    # Instalar dependencias de Python si existen
    RUN if [ -f ml/requirements.txt ]; then pip install --no-cache-dir -r ml/requirements.txt; fi
    
    # Configurar permisos
    RUN chown -R www-data:www-data /app/storage /app/bootstrap/cache \
        && chmod -R 775 /app/storage /app/bootstrap/cache
    
    # Configurar Nginx para Laravel
    COPY docker/nginx.conf /etc/nginx/nginx.conf
    COPY docker/default.conf /etc/nginx/conf.d/default.conf
    
    # Exponer puerto 80 (Nginx)
    EXPOSE 80
    
    # Iniciar PHP-FPM y Nginx
    CMD ["sh", "-c", "php-fpm -D && nginx -g 'daemon off;'"]