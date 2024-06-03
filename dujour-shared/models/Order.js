const mongoose = require('mongoose');
const { Schema } = mongoose;

const orderSchema = new Schema({
  masterOrderNumber: Number,
  customerName: String,
  customerOrderNumber: Number,
  customerEmail: String,
  deliveryAddress: String,
  deliveryDate: Date,
  overallStatus: {
    type: String,
    enum: ['Order Confirmed', 'Ready for Order Pick', 'Order Pick in Progress', 'Order Pick Complete', 'Ready for Driver Pickup', 'Out for Delivery', 'Delivered'],
    default: 'Order Confirmed'
  },
  items: [{
    item: { type: Schema.Types.ObjectId, ref: 'AvailableItem' },
    quantity: Number
  }],
  totalCost: { type: Number, default: 0 },
});

orderSchema.pre('save', async function(next) {
  try {

    const total = await this.items.reduce(async (accPromise, currentItem) => {
      const acc = await accPromise;
      const item = await mongoose.model('AvailableItem').findById(currentItem._id);
      if (!item) {
        console.error(`Item with id ${currentItem._id} not found`);
        throw new Error(`Item with id ${currentItem._id} not found`);
      }

      return acc + (item.unitCost * currentItem.quantity);
    }, Promise.resolve(0));

    this.totalCost = total;
    next();
  } catch (error) {
    console.error('Error processing order:', error);
    next(error);
  }
});

const Order = mongoose.model('Order', orderSchema, 'orders');
module.exports = Order;
