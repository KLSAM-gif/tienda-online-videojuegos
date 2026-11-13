FROM php:8.2-apache

# Instalar la extensión necesaria para conectar PHP con MySQL
RUN docker-php-ext-install pdo pdo_mysql

# Copiar los archivos del proyecto
COPY . /var/www/html/

# Activar el módulo de Apache para las rutas
RUN a2enmod rewrite

# Exponer el puerto 80
EXPOSE 80