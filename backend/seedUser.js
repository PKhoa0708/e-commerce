const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

// Load environment variables
dotenv.config();

const seedUser = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/shopee_clone';
    console.log('Connecting to database for seeding...');
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected successfully.');

    // Remove existing sample user to avoid conflict
    await User.deleteMany({ email: 'customer@urbancart.com' });
    console.log('Cleared old sample customer users.');

    // Instantiate and save new user (pre-save hook hashes password123 automatically)
    const testUser = new User({
      name: 'Nguyễn Văn Khách',
      email: 'customer@urbancart.com',
      phone: '0987654321',
      password: 'password123',
      role: 'customer',
      addresses: [
        {
          receiverName: 'Nguyễn Văn Khách',
          receiverPhone: '0987654321',
          detailAddress: '123 Đường Lê Lợi, Quận 1, TP. Hồ Chí Minh',
          isDefault: true
        }
      ]
    });

    await testUser.save();
    console.log('\n=================================================');
    console.log('🎉 TÀI KHOẢN KHÁCH HÀNG MẪU ĐÃ ĐƯỢC TẠO THÀNH CÔNG!');
    console.log('👉 Email: customer@urbancart.com');
    console.log('👉 Số điện thoại: 0987654321');
    console.log('👉 Mật khẩu: password123');
    console.log('=================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedUser();
