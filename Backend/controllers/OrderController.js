const Order = require('../models/Order');

// @desc    Get all orders
// @route   GET /api/orders
exports.getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find(); // Fetches everything from MongoDB
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch orders", error: error.message });
    }
};

// @desc    Update order status
// @route   PATCH /api/orders/:id
exports.updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const updatedOrder = await Order.findByIdAndUpdate(
            id,
            { status },
            { new: true } // This returns the document AFTER the update
        );

        if (!updatedOrder) {
            return res.status(404).json({ message: "Order not found" });
        }

        res.status(200).json(updatedOrder);
    } catch (error) {
        res.status(500).json({ message: "Update failed", error: error.message });
    }
};