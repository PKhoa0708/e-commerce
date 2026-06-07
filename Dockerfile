FROM node:20-alpine

# Thiết lập thư mục làm việc
WORKDIR /app

# Sao chép package.json và package-lock.json để cài đặt dependencies trước
COPY package*.json ./

# Cài đặt dependencies cho môi trường production
RUN npm install --production

# Sao chép toàn bộ mã nguồn vào container
COPY . .

# Mở port 3000 cho ứng dụng Node.js
EXPOSE 3000

# Lệnh khởi động ứng dụng
CMD ["npm", "start"]
