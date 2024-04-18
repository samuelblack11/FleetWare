const mongoose = require('mongoose');
const { Schema } = mongoose;

const availableItemSchema = new Schema({
  itemName: String,
  quantityAvailable: Number,
  unitCost: Number,
  farm: { type: Schema.Types.ObjectId, ref: 'Farm' },
});


const AvailableItem = mongoose.model('AvailableItem', availableItemSchema, 'availableItems');
module.exports = AvailableItem;
