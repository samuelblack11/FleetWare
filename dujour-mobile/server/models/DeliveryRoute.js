const mongoose = require('mongoose');
const { Schema } = mongoose;

const deliveryRouteSchema = new Schema({
  clusterId: Number,
  driverId: { type: Schema.Types.ObjectId, ref: 'Driver' }, // Assuming you have a Driver model
  status: { type: String, default: 'Scheduled' },
  createdAt: { type: Date, default: Date.now },
  assignedAt: Date,
  startTime: Date,
  endTime: Date,
  notes: String,
  stops: [{
    stopNumber: Number,
    address: String,
    latitude: Number,
    longitude: Number,
    deliveryDate: Date,
    dropOffTime: Date,
    orderId: { type: Schema.Types.ObjectId, ref: 'Order' },
    customerEmail: String, // Added to store the customer's email address
    orderNumber: String, // Added to store the order number
    status: { type: String, default: 'Scheduled' },
  }],
});

// Here you might include any middleware (pre/post hooks) or methods relevant to the route

const Route = mongoose.model('DeliveryRoute', deliveryRouteSchema, 'deliveryRoutes');
module.exports = Route;
