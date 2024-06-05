const mongoose = require('mongoose');
const { Schema } = mongoose;

const pickPlanSchema = new Schema({
  date: { type: Date, required: true },
  items: [{
    itemName: String,
    quantity: Number,
    vendorLocationNumber: Number,
    farmName: String,
    masterOrderNumber: Number,
    orderID: { type: Schema.Types.ObjectId, ref: 'Order' },
    status: {
      type: String,
      enum: ['Not Picked', 'Picked'],
      default: 'Not Picked'
    }
  }],
  status: {
    type: String,
    enum: ['Pick Plan Created', 'Pick In Progress', 'Pick Complete'],
    default: 'Pick Plan Created'
  },
  user: { type: Schema.Types.ObjectId, ref: 'User' },
});

const PickPlan = mongoose.model('PickPlan', pickPlanSchema, 'pickPlans');
module.exports = PickPlan;