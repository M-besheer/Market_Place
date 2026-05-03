const mongoose = require('mongoose');
const Order = require('../models/Order');
const Listing = require('../models/Listing');
const User = require('../models/User');
const OrderStatusLog = require('../models/OrderStatusLog');

// @desc    Get orders filtered by seller's listings (No actual User document required)
// @route   GET /api/orders/incoming
const getIncomingOrders = async (req, res) => {
    try {
        // This ID comes from your mockAuth middleware. 
        // It's a real-looking ObjectId, but no User document actually exists for it.
        const sellerId = req.user.id; 

        // 1. Find listings tagged with this fake seller ID
        const sellerListings = await Listing.find({ seller_id: sellerId }).select('_id');
        const listingIds = sellerListings.map(listing => listing._id);

        // 2. Find orders tied ONLY to those listings
        const incomingOrders = await Order.find({ listing_id: { $in: listingIds } })
            .populate('listing_id', 'title price delivery_days image_urls')
            .populate('buyer_id', 'firstName lastName username upVotes downVotes')
            .sort({ created_at: -1 });

        res.status(200).json(incomingOrders);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching incoming orders', error: error.message });
    }
};

// @desc    Update order status with ownership check (No actual User document required)
// @route   PUT /api/orders/:orderNumber/status
const updateOrderStatus = async (req, res) => {
    try {
        const { orderNumber } = req.params;
        const { status } = req.body;
        const sellerId = req.user.id;

        const validStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status provided' });
        }

        const order = await Order.findOne({ orderNumber }).populate('listing_id');
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Security check: This string comparison works perfectly even if the User doesn't exist!
        if (order.listing_id.seller_id.toString() !== sellerId) {
            return res.status(403).json({ message: 'Not authorized to update this order' });
        }

        order.status = status;
        await order.save();

        const statusLog = new OrderStatusLog({
            orderNumber: order.orderNumber,
            status: status
        });
        await statusLog.save();

        res.status(200).json({
            message: 'Order status updated successfully',
            order,
            statusLog
        });
    } catch (error) {
        res.status(500).json({ message: 'Error updating order status', error: error.message });
    }
};

// @desc    Flag a buyer as good or bad from a seller order view
// @route   PUT /api/orders/:orderNumber/flag
const flagBuyer = async (req, res) => {
    try {
        const { orderNumber } = req.params;
        const { flag } = req.body;
        const sellerId = req.user.id;

        if (!['good', 'bad'].includes(flag)) {
            return res.status(400).json({ message: 'Invalid flag value' });
        }

        const order = await Order.findOne({ orderNumber }).populate('listing_id').populate('buyer_id');
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (order.listing_id.seller_id.toString() !== sellerId) {
            return res.status(403).json({ message: 'Not authorized to flag this buyer' });
        }

        const previousFlag = order.sellerFlag;
        if (flag === previousFlag) {
            // If the seller clicks the same vote again, remove the vote entirely.
            const buyer = await User.findById(order.buyer_id._id);
            if (!buyer) {
                return res.status(404).json({ message: 'Buyer not found' });
            }

            if (previousFlag === 'good') {
                buyer.upVotes = Math.max(0, buyer.upVotes - 1);
            } else if (previousFlag === 'bad') {
                buyer.downVotes = Math.max(0, buyer.downVotes - 1);
            }

            order.sellerFlag = null;
            await Promise.all([buyer.save(), order.save()]);

            return res.status(200).json({
                message: 'Buyer flag removed successfully',
                buyer: { username: buyer.username, upVotes: buyer.upVotes, downVotes: buyer.downVotes },
                order: { orderNumber: order.orderNumber, sellerFlag: order.sellerFlag }
            });
        }

        const buyer = await User.findById(order.buyer_id._id);
        if (!buyer) {
            return res.status(404).json({ message: 'Buyer not found' });
        }

        if (previousFlag === 'good') {
            buyer.upVotes = Math.max(0, buyer.upVotes - 1);
        } else if (previousFlag === 'bad') {
            buyer.downVotes = Math.max(0, buyer.downVotes - 1);
        }

        if (flag === 'good') {
            buyer.upVotes += 1;
        } else if (flag === 'bad') {
            buyer.downVotes += 1;
        }

        order.sellerFlag = flag;

        await Promise.all([buyer.save(), order.save()]);

        res.status(200).json({
            message: 'Buyer flag updated successfully',
            buyer: { username: buyer.username, upVotes: buyer.upVotes, downVotes: buyer.downVotes },
            order: { orderNumber: order.orderNumber, sellerFlag: order.sellerFlag }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error flagging buyer', error: error.message });
    }
};

module.exports = {
    getIncomingOrders,
    updateOrderStatus,
    flagBuyer
};