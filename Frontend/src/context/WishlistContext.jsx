import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const WishlistContext = createContext();
const API = 'http://localhost:5000/api/wishlist';

export function WishlistProvider({ children }) {
  const [wishlistIds, setWishlistIds] = useState(new Set());
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

  // Load just the IDs when token changes
  useEffect(() => {
    if (!token) {
      setWishlistIds(new Set());
      return;
    }

    fetch(`${API}/ids`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : { ids: [] })
      .then(data => {
        const rawIds = data.ids || [];
        // Only keep valid 24-char hex strings (ObjectIds)
        const cleanIds = rawIds.filter(id => typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id));
        setWishlistIds(new Set(cleanIds));
      })
      .catch(() => setWishlistIds(new Set()));

  }, [token]);



  const isWishlisted = useCallback((productId) => wishlistIds.has(productId), [wishlistIds]);

  const toggleWishlist = useCallback(async (productId) => {
    if (!token) return false; // signal: not logged in


    const alreadyIn = wishlistIds.has(productId);

    // Optimistic update
    setWishlistIds(prev => {
      const next = new Set(prev);
      alreadyIn ? next.delete(productId) : next.add(productId);
      return next;
    });

    try {
      const res = await fetch(`${API}/${productId}`, {
        method: alreadyIn ? 'DELETE' : 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Request failed');

      const data = await res.json();
      const rawIds = data.wishlistIds || [];
      const cleanIds = rawIds.filter(id => typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id));
      setWishlistIds(new Set(cleanIds));
      return true;

    } catch {
      // Rollback on error
      setWishlistIds(prev => {
        const next = new Set(prev);
        alreadyIn ? next.add(productId) : next.delete(productId);
        return next;
      });
      return false;
    }
  }, [wishlistIds, token]);

  const clearWishlist = useCallback(() => {
    setWishlistIds(new Set());
  }, []);

  return (
    <WishlistContext.Provider value={{ wishlistIds, isWishlisted, toggleWishlist, clearWishlist, loading }}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => useContext(WishlistContext);
