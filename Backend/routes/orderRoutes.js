const express = require('express');
const router = express.Router();
const { placeOrder, getBuyerOrders, getOrderById } = require('../controllers/orderController');
const { getIncomingOrders, updateOrderStatus } = require('../controllers/OrderControllerSeller');

// MOCK AUTH MIDDLEWARE: Pretend we are a logged-in seller
const mockAuth = (req, res, next) => {
    req.user = {
        id: '65f0a1b2c3d4e5f6a7b8c9d0' // A fake MongoDB ObjectId for our test seller
    };
    next();
};

//place a new order
router.post('/', placeOrder);

//get all orders for the buyer
router.get('/', getBuyerOrders);

// Route for sellers to view their incoming orders
router.get('/incoming', mockAuth, getIncomingOrders);

//get a single order by ID
router.get('/:id', getOrderById);

// const { protect } = require('../middleware/authMiddleware'); // Your auth middleware




// Route for sellers to update an order's status
router.put('/:id/status', mockAuth, updateOrderStatus);


module.exports = router;