const express = require('express');
const router = express.Router();
const { protect } = require('../controllers/authController');
const {
  getCart,
  addToCart,
  updateCartItemQuantity,
  removeFromCart,
  clearCart
} = require('../controllers/cartController');

// All cart routes require authentication
router.use(protect);

router.get('/', getCart);
router.post('/add', addToCart);
router.put('/update', updateCartItemQuantity);
router.delete('/:listing_id', removeFromCart);
router.delete('/', clearCart);

module.exports = router;
