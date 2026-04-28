const mongoose = require('mongoose');
const orderSchema = new mongoose.Schema(
    {
        orderNumber: {
            type: String,
            unique: true,
        },

        buyer_id:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },

        listing_id:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Listing',
            required: true,
        },

        status:{
            type: String,
            enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
            default: 'Pending',
        },
    },
    {
        timestamps: true,
        collection: 'orders_order'
    }
);

// Auto-generate ORD-001, ORD-002, etc.
orderSchema.pre('save', async function() {
    if (this.isNew) {
        const count = await mongoose.model('Order').countDocuments();
        this.orderNumber = `ORD-${String(count + 1).padStart(3, '0')}`;
    }
    
});

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;