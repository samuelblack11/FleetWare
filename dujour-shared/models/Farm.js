const mongoose = require('mongoose');
const { Schema } = mongoose;

const farmSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String},
  address: { type: String, required: true },
  phoneNumber: String,
  emailAddress: String,
  vendorLocationNumber: Number
});

const Farm = mongoose.model('Farm', farmSchema);

module.exports = Farm;
