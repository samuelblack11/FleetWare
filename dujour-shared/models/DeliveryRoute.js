const mongoose = require('mongoose');
const { Schema } = mongoose;

const deliveryRouteSchema = new Schema({
  clusterId: Number,
  driver: { type: Schema.Types.ObjectId, ref: 'User' },
  //status: { type: String, default: 'Scheduled' },
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
    orderStatus: String,
    customerEmail: String,
    masterOrderNumber: Number,
  }],
  status: {
    type: String,
    enum: ['Scheduled' ,'Driver Assigned', 'Ready for Driver Pickup','Out for Delivery',  'Delivered'],
    default: 'Scheduled' 
  }
});

// Here you might include any middleware (pre/post hooks) or methods relevant to the route

const DeliveryRoute = mongoose.model('DeliveryRoute', deliveryRouteSchema, 'deliveryRoutes');
module.exports = DeliveryRoute;
