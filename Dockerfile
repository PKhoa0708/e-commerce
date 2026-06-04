FROM php:8.2-apache

# Cài đặt các công cụ cần thiết và thư viện OpenSSL để cài extension mongodb
RUN apt-get update && apt-get install -y \
    libssl-dev \
    unzip \
    git \
    && rm -rf /var/lib/apt/lists/*

# Cài đặt extension mongodb cho PHP
RUN pecl install mongodb && docker-php-ext-enable mongodb

# Kích hoạt module rewrite của Apache (nếu cần)
RUN a2enmod rewrite

# Copy toàn bộ mã nguồn vào thư mục public của Apache
COPY . /var/www/html/

# Thiết lập thư mục làm việc
WORKDIR /var/www/html/

# Sao chép Composer từ ảnh chính thức và cài đặt dependencies
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer
RUN composer install --no-interaction --optimize-autoloader

# Phân quyền cho Apache đọc ghi file
RUN chown -R www-data:www-data /var/www/html

# Mở port 80 cho web
EXPOSE 80
