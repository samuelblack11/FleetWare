const mongoose = require('mongoose');
const { Schema } = mongoose;

const driverSchema = new Schema({
  Name: String,
  Address: String,
  LicenseNumber: String,
  LicenseExpiration: Date,
  PhoneNumber: String,
  Email: String,
  EmergencyContact: String,
  DateOfHiring: Date,
  Position: String,
  Department: String,
  DrivingRecord: String,
  TrainingRecords: String,
  StandardVehicleAssignment: String,
  PerformanceReviews: String
});

const Driver = mongoose.model('Driver', driverSchema);
module.exports = Driver;
