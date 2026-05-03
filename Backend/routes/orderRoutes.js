const express = require('express');
const router = express.Router();
const { placeOrder, getBuyerOrders, getOrderById } = require('../controllers/orderController');
const { getIncomingOrders, updateOrderStatus, flagBuyer } = require('../controllers/OrderControllerSeller');
const { protect } = require('../controllers/authController'); // Your auth middleware

//place a new order
router.post('/', protect, placeOrder);

//get all orders for the buyer
router.get('/', protect, getBuyerOrders);

// Route for sellers to view their incoming orders
router.get('/incoming', protect, getIncomingOrders);

//get a single order by ID
router.get('/:id', getOrderById);

// Route for sellers to update an order's status
router.put('/:orderNumber/status', protect, updateOrderStatus);

// Route for sellers to flag a buyer good or bad for an order
router.put('/:orderNumber/flag', protect, flagBuyer);


module.exports = router;