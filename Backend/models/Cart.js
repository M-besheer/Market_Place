const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    items: [
      {
        listing_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Listing',
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
          default: 1,
        },
      }
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Cart', cartSchema);
