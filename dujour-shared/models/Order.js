const mongoose = require('mongoose');
const { Schema } = mongoose;

const orderSchema = new Schema({
  customerName: String,
  orderNumber: Number,
  customerEmail: String,
  deliveryAddress: String,
  deliveryDate: Date,
  status: { 
    type: String, 
    enum: ['Unassembled', 'Pending Driver Pickup', 'Out for Delivery', 'Delivered', 'Damaged', 'Unable to Deliver'],
    default: 'Unassembled' // or choose the most appropriate default status
  },  
  items: [{
    //item: { type: Schema.Types.ObjectId, ref: 'Product' },
    itemName: String,
    quantity: Number,
    pickupAddress: String,
    unitCost: Number,
  }],
  totalCost: { type: Number, default: 0 },
});

orderSchema.pre('save', function(next) {
  let total = 0;
  this.items.forEach(item => {
    total += item.quantity * item.unitCost;
  });
  this.totalCost = total;
  next();
});

const Order = mongoose.model('Order', orderSchema, 'orders');
module.exports = Order;
