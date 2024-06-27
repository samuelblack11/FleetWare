const mongoose = require('mongoose');
const { Schema } = mongoose;

const promoCodeSchema = new Schema({
  code: { type: String, required: true, unique: true },
  type: {
    type: String,
    enum: ['discount', 'freeShipping'],
    required: true
  },
  amount: { type: Number, required: function() { return this.type === 'discount'; } } // Amount is required only if type is 'discount'
});

const PromoCode = mongoose.model('PromoCode', promoCodeSchema, 'promoCodes');
module.exports = PromoCode;
