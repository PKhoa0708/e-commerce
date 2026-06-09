const Product = require('../models/Product');

const dummyProducts = [
  {
    name: 'Áo Khoác Bomber Đô Thị (Urban Bomber Jacket)',
    description: 'Áo khoác bomber thời trang đô thị với chất liệu chống nước nhẹ, lớp lót ấm áp, thích hợp cho thời tiết se lạnh và phong cách năng động hàng ngày.',
    price: 850000,
    category: 'Thời trang Nam',
    images: ['https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&auto=format&fit=crop&q=80'],
    variants: {
      sizes: ['M', 'L', 'XL'],
      colors: ['Đen', 'Rêu']
    },
    stockQuantity: 35,
    rating: 4.8
  },
  {
    name: 'Áo Thun Cotton Basic (Classic Cotton T-Shirt)',
    description: 'Áo thun 100% cotton tự nhiên mềm mại, thoáng mát và co giãn tốt. Kiểu dáng basic dễ dàng phối đồ với quần jeans hoặc quần đùi.',
    price: 250000,
    category: 'Thời trang Nam',
    images: ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80'],
    variants: {
      sizes: ['S', 'M', 'L', 'XL'],
      colors: ['Trắng', 'Đen', 'Xám']
    },
    stockQuantity: 120,
    rating: 4.5
  },
  {
    name: 'Giày Sneakers Trắng Đô Thị (Urban White Sneakers)',
    description: 'Giày Sneakers phong cách năng động với đế cao su lưu hóa chống trượt tốt, chất liệu da nhân tạo cao cấp dễ lau chùi, nâng dáng hoàn hảo.',
    price: 1200000,
    category: 'Giày dép',
    images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80'],
    variants: {
      sizes: ['39', '40', '41', '42'],
      colors: ['Trắng', 'Đỏ']
    },
    stockQuantity: 25,
    rating: 4.9
  },
  {
    name: 'Balo Đựng Laptop Chống Nước (Waterproof Laptop Backpack)',
    description: 'Balo thiết kế nhiều ngăn thông minh, có ngăn đệm chống sốc dày cho laptop 15.6 inch, chất liệu vải Oxford chống thấm nước và chống trầy xước.',
    price: 650000,
    category: 'Phụ kiện',
    images: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80'],
    variants: {
      sizes: ['Tiêu chuẩn'],
      colors: ['Đen', 'Xám', 'Xanh']
    },
    stockQuantity: 50,
    rating: 4.7
  },
  {
    name: 'Áo Hoodie Nỉ Phối Màu (Vibrant Pullover Hoodie)',
    description: 'Áo hoodie chất liệu nỉ bông ấm áp mềm mại, thiết kế phối màu trẻ trung thời thượng. Phù hợp cho cả nam và nữ diện phố những ngày thu đông.',
    price: 490000,
    category: 'Thời trang Nam',
    images: ['https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&auto=format&fit=crop&q=80'],
    variants: {
      sizes: ['M', 'L', 'XL'],
      colors: ['Xanh Dương', 'Cam', 'Đen']
    },
    stockQuantity: 40,
    rating: 4.6
  },
  {
    name: 'Mũ Lưỡi Trai Kaki Basic (Classic Kaki Cap)',
    description: 'Mũ lưỡi trai chất liệu vải kaki cotton dày dặn bền đẹp, khóa điều chỉnh kim loại phía sau tiện lợi, tạo phong cách năng động và che nắng hiệu quả.',
    price: 150000,
    category: 'Phụ kiện',
    images: ['https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600&auto=format&fit=crop&q=80'],
    variants: {
      sizes: ['Free Size'],
      colors: ['Đen', 'Kaki', 'Trắng']
    },
    stockQuantity: 80,
    rating: 4.4
  },
  {
    name: 'Quần Jeans Dáng Suông (Classic Straight Jeans)',
    description: 'Quần jeans chất bò denim cao cấp dày dặn, không phai màu và giữ dáng tốt sau nhiều lần giặt. Thiết kế dáng suông trẻ trung thanh lịch.',
    price: 550000,
    category: 'Thời trang Nam',
    images: ['https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&auto=format&fit=crop&q=80'],
    variants: {
      sizes: ['29', '30', '31', '32'],
      colors: ['Xanh Sáng', 'Xanh Đậm']
    },
    stockQuantity: 45,
    rating: 4.6
  },
  {
    name: 'Kính Mát Thời Trang Phi Công (Classic Aviator Sunglasses)',
    description: 'Kính mát phi công tròng phân cực chống tia UV400 bảo vệ mắt tối đa khỏi ánh nắng gắt. Gọng kim loại siêu nhẹ bền bỉ, thời trang thời thượng.',
    price: 350000,
    category: 'Phụ kiện',
    images: ['https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&auto=format&fit=crop&q=80'],
    variants: {
      sizes: ['Tiêu chuẩn'],
      colors: ['Đen', 'Vàng Kim']
    },
    stockQuantity: 30,
    rating: 4.7
  },
  {
    name: 'Đồng Hồ Thông Minh Urban Fit (Urban Smartwatch)',
    description: 'Đồng hồ theo dõi chỉ số sức khỏe, nhịp tim, bước chân và giấc ngủ. Tích hợp nhiều chế độ thể thao, màn hình hiển thị AMOLED và pin trâu 7 ngày.',
    price: 1800000,
    category: 'Phụ kiện',
    images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80'],
    variants: {
      sizes: ['44mm'],
      colors: ['Đen', 'Bạc']
    },
    stockQuantity: 15,
    rating: 4.8
  },
  {
    name: 'Tai Nghe Không Dây Chống Ồn (Wireless ANC Headphones)',
    description: 'Tai Nghe Over-Ear tích hợp công nghệ chống ồn chủ động ANC thế hệ mới mang lại không gian âm nhạc tĩnh lặng tuyệt đối. Màng loa 40mm âm thanh vòm sống động.',
    price: 2500000,
    category: 'Công nghệ',
    images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80'],
    variants: {
      sizes: ['Tiêu chuẩn'],
      colors: ['Đen', 'Trắng']
    },
    stockQuantity: 20,
    rating: 4.9
  }
];

const seedProducts = async () => {
  try {
    const count = await Product.countDocuments();
    if (count === 0) {
      console.log('Product collection is empty. Seeding dummy products...');
      await Product.insertMany(dummyProducts);
      console.log(`Successfully seeded ${dummyProducts.length} dummy products!`);
    } else {
      console.log(`Database already has ${count} products. Skipping seeding.`);
    }
  } catch (error) {
    console.error('Error seeding products:', error);
  }
};

module.exports = seedProducts;
