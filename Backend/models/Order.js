const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  customer: { type: String, required: true },
  date: { type: Date, required: true },
  items: { type: Number, required: true },
  total: { type: Number, required: true },
  status: { 
    type: String, 
    default: 'pending',
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
  }
});

module.exports = mongoose.model('Order', orderSchema);