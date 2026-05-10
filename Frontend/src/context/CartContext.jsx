import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchCart, addItemToCart, updateItemQuantity, removeItemFromCart, clearUserCart } from '../services/cartService';

const CartContext = createContext();

export function CartProvider({ children }) {
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [token, setToken] = useState(localStorage.getItem('token'));

    // Sync token from localStorage (useful since there's no global AuthContext)
    useEffect(() => {
        const interval = setInterval(() => {
            const currentToken = localStorage.getItem('token');
            if (currentToken !== token) {
                setToken(currentToken);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [token]);
    const loadCart = useCallback(async () => {
        if (!token) {
            // If not logged in, maybe fallback to localStorage or just empty
            const savedCart = localStorage.getItem('marketplace_cart');
            setCartItems(savedCart ? JSON.parse(savedCart) : []);
            return;
        }

        setLoading(true);
        try {
            const data = await fetchCart();
            // Map backend fields to frontend-expected names for compatibility
            const items = data.items.map(item => ({
                ...item,
                listing_id: item._id,
                name: item.title,
                image: item.image_url,
                stock: item.countInStock
            }));
            setCartItems(items);
        } catch (error) {
            console.error('Failed to fetch cart:', error);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        loadCart();
    }, [loadCart]);

    // Save to localStorage as backup for non-logged in users
    useEffect(() => {
        if (!token) {
            localStorage.setItem('marketplace_cart', JSON.stringify(cartItems));
        }
    }, [cartItems, token]);

    const addToCart = async (item) => {
        console.log('Adding to cart:', item, 'Logged in:', !!token);
        
        // Basic check for frontend
        if ((item.stock || 0) <= 0) {
            import('react-toastify').then(({ toast }) => toast.warning('This item is currently out of stock.'));
            return;
        }

        if (token) {
            try {
                const res = await addItemToCart(item.listing_id, item.quantity || 1);
                console.log('Server response:', res);
                await loadCart(); // Refresh from server to ensure sync
                import('react-toastify').then(({ toast }) => toast.success('Added to cart!'));
            } catch (error) {
                console.error('Failed to add to cart:', error);
                const errorMsg = error.response?.data?.message || 'Failed to add to cart. Please try again.';
                import('react-toastify').then(({ toast }) => toast.error(errorMsg));
            }
        } else {
            console.log('Guest mode: Adding to local state');
            setCartItems(prev => {
                const existingItem = prev.find(i => i.listing_id === item.listing_id);
                const requestedQty = item.quantity || 1;
                
                if (existingItem) {
                    const newQty = existingItem.quantity + requestedQty;
                    // Cap at stock
                    if (newQty > (item.stock || 999)) {
                        import('react-toastify').then(({ toast }) => toast.info(`Capped at available stock (${item.stock})`));
                        return prev.map(i => 
                            i.listing_id === item.listing_id 
                                ? { ...i, quantity: item.stock } 
                                : i
                        );
                    }
                    return prev.map(i => 
                        i.listing_id === item.listing_id 
                            ? { ...i, quantity: newQty } 
                            : i
                    );
                }
                
                const finalQty = Math.min(requestedQty, item.stock || 999);
                const newItem = { ...item, quantity: finalQty };
                return [...prev, newItem];
            });
            import('react-toastify').then(({ toast }) => toast.success('Added to cart (Guest)!'));
        }
    };


    const removeFromCart = async (listing_id) => {
        if (token) {
            try {
                await removeItemFromCart(listing_id);
                await loadCart();
                import('react-toastify').then(({ toast }) => toast.success('Removed from cart'));
            } catch (error) {
                console.error('Failed to remove from cart:', error);
                import('react-toastify').then(({ toast }) => toast.error('Failed to remove from cart'));
            }
        } else {
            setCartItems(prev => prev.filter(item => item.listing_id !== listing_id));
        }
    };

    const updateQuantity = async (listing_id, newQuantity) => {
        const qty = Math.max(1, newQuantity);
        
        // Find the item to check its stock
        const item = cartItems.find(i => i.listing_id === listing_id);
        const maxStock = item?.stock || 999;

        if (qty > maxStock) {
            import('react-toastify').then(({ toast }) => toast.warning(`Only ${maxStock} units available`));
            return;
        }

        if (token) {
            try {
                await updateItemQuantity(listing_id, qty);
                await loadCart();
            } catch (error) {
                console.error('Failed to update quantity:', error);
                const errorMsg = error.response?.data?.message || 'Failed to update quantity';
                import('react-toastify').then(({ toast }) => toast.error(errorMsg));
            }
        } else {
            setCartItems(prev => prev.map(item => 
                item.listing_id === listing_id 
                    ? { ...item, quantity: qty } 
                    : item
            ));
        }
    };


    const clearCart = async () => {
        if (token) {
            try {
                await clearUserCart();
                setCartItems([]);
            } catch (error) {
                console.error('Failed to clear cart:', error);
            }
        } else {
            setCartItems([]);
        }
    };

    return (
        <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, clearCart, loading }}>
            {children}
        </CartContext.Provider>
    );
}

export const useCart = () => useContext(CartContext);
