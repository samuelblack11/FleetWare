const mongoose = require('mongoose');
const { Schema } = mongoose;

const availableItemSchema = new Schema({
  itemName: String,
  description: String,
  originalQuantity: Number,
  quantityAvailable: Number,
  unitCost: Number,
  farm: { type: Schema.Types.ObjectId, ref: 'Farm' },
  forDeliveryOn: Date,
  activeStatus: { type: Boolean, default: false }  // Setting default value to false
});


const AvailableItem = mongoose.model('AvailableItem', availableItemSchema, 'availableItems');
module.exports = AvailableItem;
