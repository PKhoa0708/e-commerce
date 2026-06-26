const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const addressSchema = new mongoose.Schema({
  receiverName: { type: String, required: true },
  receiverPhone: { type: String, required: true },
  detailAddress: { type: String, required: true },
  isDefault: { type: Boolean, default: false }
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, sparse: true, trim: true, lowercase: true, index: true },
  phone: { type: String, default: null },
  password: { 
    type: String, 
    required: function() {
      return this.authProvider === 'local';
    }
  },
  authProvider: { type: String, default: 'local' },
  role: { type: String, default: 'customer', enum: ['customer', 'seller', 'admin'] },
  avatar: { type: String, default: null },
  addresses: [addressSchema]
}, {
  timestamps: true // Automatically creates createdAt and updatedAt
});

// Hash password before saving to DB
userSchema.pre('save', async function (next) {
  if (!this.password || !this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to verify password on login
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
