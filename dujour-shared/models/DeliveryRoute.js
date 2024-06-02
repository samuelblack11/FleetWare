const mongoose = require('mongoose');
const { Schema } = mongoose;

const deliveryRouteSchema = new Schema({
  clusterId: Number,
  driver: { type: Schema.Types.ObjectId, ref: 'User' },
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
    customerEmail: String,
    orderNumber: String,
    status: { type: String, default: 'Scheduled' },
  }],
  status: {
    type: String,
    enum: ['Driver Assigned', 'En Route', 'Delivered'],
    default: 'Driver Assigned'
  }
});

// Here you might include any middleware (pre/post hooks) or methods relevant to the route

const DeliveryRoute = mongoose.model('DeliveryRoute', deliveryRouteSchema, 'deliveryRoutes');
module.exports = DeliveryRoute;
