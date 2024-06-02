const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: { type: String, unique: true, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['Admin', 'Manager', 'Customer', 'Driver'],
    default: 'Customer'
  },
  lastOrderNumber: { type: Number, default: 0 },
  creditCardInfo: { type: String, default: '' },
  deliveryAddress: { type: String, default: '' },
  isFirstLogin: { type: Boolean, default: true },
});

const User = mongoose.model('User', userSchema);

module.exports = User;
