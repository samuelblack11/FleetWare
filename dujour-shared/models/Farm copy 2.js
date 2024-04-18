const mongoose = require('mongoose');
const { Schema } = mongoose;

const farmSchema = new Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  phoneNumber: String,
  emailAddress: String,
});

module.exports = mongoose.model('Farm', farmSchema);
