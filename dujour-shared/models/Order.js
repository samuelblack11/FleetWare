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
    enum: ['Order Confirmed', 'Ready for Order Pick', 'Order Pick in Progress', 'Order Pick Complete', 'Ready for Driver Pickup', 'Picked up by Driver', 'Out for Delivery', 'Delivered'],
    default: 'Order Confirmed'
  },
  items: [{
    item: { type: Schema.Types.ObjectId, ref: 'AvailableItem' },
    quantity: Number
  }],
  totalCost: { type: Number, default: 0 },
  totalCostPreDiscount: { type: Number, default: 0 }
});


const Order = mongoose.model('Order', orderSchema, 'orders');
module.exports = Order;
