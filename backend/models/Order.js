const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },       // snapshot tên sản phẩm
  image: { type: String, default: '' },          // snapshot ảnh
  price: { type: Number, required: true },       // snapshot giá tại thời điểm mua
  quantity: { type: Number, required: true, min: 1 },
  size: { type: String, default: '' },
  color: { type: String, default: '' },
});

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [orderItemSchema],
  shippingInfo: {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    note: { type: String, default: '' },
  },
  paymentMethod: {
    type: String,
    enum: ['cod', 'bank', 'momo', 'vnpay'],
    default: 'cod',
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending',
  },
  paymentDetails: {
    transactionId: { type: String, default: '' },
    paymentDate: { type: Date },
    vnpTxnRef: { type: String, default: '' },
    vnpTransactionNo: { type: String, default: '' }
  },
  subtotal: { type: Number, required: true },
  shippingFee: { type: Number, default: 30000 },
  total: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'shipping', 'delivered', 'cancelled'],
    default: 'pending',
  },
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
