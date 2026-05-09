const Cart = require('../models/Cart');
const Listing = require('../models/Listing');

/**
 * GET /api/cart
 * Returns the authenticated user's cart with populated listing data.
 */
const getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user_id: req.user.id })
      .populate({
        path: 'items.listing_id',
        populate: [
          { path: 'category_id', select: 'name' },
          { path: 'seller_id', select: 'username' }
        ],
      });

    if (!cart) {
      // Create an empty cart if it doesn't exist
      cart = await Cart.create({ user_id: req.user.id, items: [] });
    }

    // Format the items to be more frontend-friendly
    const items = cart.items
      .filter(item => item.listing_id) // Ensure listing still exists
      .map(item => {
        const l = item.listing_id;
        return {
          _id: l._id,
          title: l.title,
          price: l.price,
          quantity: item.quantity,
          countInStock: l.countInStock,
          image_url: l.image_urls?.[0] || 'https://i.ibb.co/000000/default-image.jpg',
          category_name: l.category_id?.name || 'Uncategorized',
          seller_id: l.seller_id?._id?.toString() || l.seller_id?.toString(),
          seller: l.seller_id?.username || 'Unknown Seller',
          serviceableAreas: l.serviceableAreas || [],
        };
      });

    res.status(200).json({ items });
  } catch (err) {
    console.error('getCart error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

/**
 * POST /api/cart/add
 * Adds or updates an item in the cart.
 * Body: { listing_id, quantity }
 */
const addToCart = async (req, res) => {
  try {
    const { listing_id, quantity = 1 } = req.body;

    const listing = await Listing.findById(listing_id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });

    let cart = await Cart.findOne({ user_id: req.user.id });

    if (!cart) {
      cart = await Cart.create({
        user_id: req.user.id,
        items: [{ listing_id, quantity }]
      });
    } else {
      const itemIndex = cart.items.findIndex(item => item.listing_id.toString() === listing_id);

      if (itemIndex > -1) {
        // Update quantity
        cart.items[itemIndex].quantity += quantity;
      } else {
        // Add new item
        cart.items.push({ listing_id, quantity });
      }
      await cart.save();
    }

    res.status(200).json({ success: true, message: 'Item added to cart' });
  } catch (err) {
    console.error('addToCart error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

/**
 * PUT /api/cart/update
 * Updates the quantity of a specific item in the cart.
 * Body: { listing_id, quantity }
 */
const updateCartItemQuantity = async (req, res) => {
  try {
    const { listing_id, quantity } = req.body;

    if (quantity < 1) {
      return res.status(400).json({ message: 'Quantity must be at least 1' });
    }

    const cart = await Cart.findOne({ user_id: req.user.id });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    const itemIndex = cart.items.findIndex(item => item.listing_id.toString() === listing_id);
    if (itemIndex === -1) return res.status(404).json({ message: 'Item not in cart' });

    cart.items[itemIndex].quantity = quantity;
    await cart.save();

    res.status(200).json({ success: true, message: 'Cart updated' });
  } catch (err) {
    console.error('updateCartItemQuantity error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

/**
 * DELETE /api/cart/:listing_id
 * Removes an item from the cart.
 */
const removeFromCart = async (req, res) => {
  try {
    const { listing_id } = req.params;

    const cart = await Cart.findOne({ user_id: req.user.id });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    cart.items = cart.items.filter(item => item.listing_id.toString() !== listing_id);
    await cart.save();

    res.status(200).json({ success: true, message: 'Item removed from cart' });
  } catch (err) {
    console.error('removeFromCart error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

/**
 * DELETE /api/cart
 * Clears the user's cart.
 */
const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user_id: req.user.id });
    if (cart) {
      cart.items = [];
      await cart.save();
    }
    res.status(200).json({ success: true, message: 'Cart cleared' });
  } catch (err) {
    console.error('clearCart error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItemQuantity,
  removeFromCart,
  clearCart
};
