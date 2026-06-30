#!/bin/sh
set -e

export PORT="${PORT:-80}"

envsubst '${PORT}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

php-fpm -D
exec nginx -g 'daemon off;'
