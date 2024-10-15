  const mongoose = require('mongoose');

  const hospitalSchema = new mongoose.Schema({
    name: {
      type: String,
      required: true,
    },
    address: {
      country: String,
      state: String,
      city: String,
      street: String,
    },
    phone: String,
    website: String,
  }, { timestamps: true });

  module.exports = mongoose.model('Hospital', hospitalSchema);