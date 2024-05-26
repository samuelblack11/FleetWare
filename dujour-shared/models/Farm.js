const mongoose = require('mongoose');
const { Schema } = mongoose;

const farmSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  address: { type: String, required: true },
  phoneNumber: String,
  emailAddress: String,
});

const Farm = mongoose.model('Farm', farmSchema);

module.exports = Farm;
