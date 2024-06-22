const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: { type: String},
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['admin', 'supplier', 'customer', 'employee'],
    default: 'customer'
  },
  lastOrderNumber: { type: Number, default: 0 },
  creditCardInfo: { type: String, default: '' },
  deliveryAddress: { type: String, default: '' },
  isFirstLogin: { type: Boolean, default: true },
  accountStatus: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'inactive'
  }
});

const User = mongoose.model('User', userSchema);

module.exports = User;
