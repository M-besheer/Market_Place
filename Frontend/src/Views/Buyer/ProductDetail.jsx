import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import './ProductDetail.css';

function StarRating({ rating }) {
  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={star <= Math.round(rating) ? 'star filled' : 'star'}>
          &#9733;
        </span>
      ))}
      <span className="rating-number">{rating || 'N/A'}</span>
    </div>
  );
}
 
function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [orderCreated, setOrderCreated] = useState(false);
 
  // Fetch product from API when component mounts or id changes
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:5000/api/products/${id}`);
        
        if (!response.ok) {
          throw new Error('Product not found');
        }
        
        const data = await response.json();
        setProduct(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching product:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id]);

  const totalPrice = product ? Number((product.price * quantity).toFixed(2)) : 0;
 
  const handleQuantityChange = (event) => {
    const value = Number(event.target.value);
    if (!product) return;
    if (value < 1) { setQuantity(1); return; }
    if (value > product.countInStock) { setQuantity(product.countInStock); return; }
    setQuantity(value);
  };
 
  const handlePlaceOrder = async () => {
    if (!product) return;
    try {
      const response = await fetch('http://localhost:5000/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          listing_id: product._id,
          quantity: quantity,
        }),
      });

      if (response.ok) {
        setOrderCreated(true);
      } else {
        const errData = await response.json();
        console.error('Failed to place order:', errData.message);
      }
    } catch (error) {
      console.error('Error placing order:', error);
    }
  };

  if (loading) {
    return (
      <div className="product-detail-page">
        <header className="product-detail-header-bar">
          <div className="header-logo">
            <span className="header-logo-icon">&#128722;</span>
            <span className="header-logo-label">MarketPlace</span>
          </div>
        </header>
        <main className="page-body">
          <p className="loading-message">Loading product details...</p>
        </main>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="product-detail-page">
        <header className="product-detail-header-bar">
          <div className="header-logo">
            <span className="header-logo-icon">&#128722;</span>
            <span className="header-logo-label">MarketPlace</span>
          </div>
        </header>
        <main className="page-body">
          <p className="error-message">Error loading product: {error || 'Product not found'}</p>
          <Link to="/products" className="back-link">Back to Products</Link>
        </main>
      </div>
    );
  }
 
  return (
    <div className="product-detail-page">
 
      {/* ── Navbar ── */}
      <header className="product-detail-header-bar">
        <div className="header-logo">
          <span className="header-logo-icon">&#128722;</span>
          <span className="header-logo-label">MarketPlace</span>
        </div>
        <nav className="header-nav">
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/products" className="nav-link">Catalog</Link>
          <Link to="/buyer/orders" className="nav-link">My Orders</Link>
        </nav>
        <div className="header-user">
          <div className="avatar">B</div>
          <span className="header-username">Buyer</span>
        </div>
      </header>
 
      <main className="page-body">
 
        {/* ── Breadcrumb ── */}
        <nav className="breadcrumb">
          <Link to="/" className="breadcrumb-link">Home</Link>
          <span className="breadcrumb-sep">›</span>
          <Link to="/products" className="breadcrumb-link">Catalog</Link>
          <span className="breadcrumb-sep">›</span>
          <span className="breadcrumb-current">{product.name}</span>
        </nav>
 
        {/* ── Main Product Card ── */}
        <section className="product-detail-card">
          <div className="product-detail-image">
            <img src={product.imageUrl || 'https://via.placeholder.com/400'} alt={product.name} />
          </div>
 
          <div className="product-detail-info">
            <div className="product-detail-top">
              <div>
                <p className="product-category">{product.category || 'Uncategorized'}</p>
                <h1>{product.name}</h1>
              </div>
              <span className="product-price">${product.price.toFixed(2)}</span>
            </div>
 
            <p className="product-description">{product.description || 'No description available'}</p>
 
            <div className="product-meta-row">
              <div>
                <span className="label">Brand</span>
                <p>{product.brand || 'Unknown'}</p>
              </div>
              <div>
                <span className="label">Available</span>
                <p>{product.countInStock || 0} in stock</p>
              </div>
              <div>
                <span className="label">Rating</span>
                <p>{Number(product.rating || 0).toFixed(1)} ⭐</p>
              </div>
            </div>
 
            <div className="order-controls">
              <label htmlFor="quantity">Quantity</label>
              <input
                id="quantity"
                type="number"
                min="1"
                max={product.countInStock || 1}
                value={quantity}
                onChange={handleQuantityChange}
                disabled={product.countInStock <= 0}
              />
            </div>
 
            <div className="order-summary">
              <p><strong>Total</strong></p>
              <p className="total-price">${totalPrice.toFixed(2)}</p>
            </div>
 
            <button
              className="place-order-button"
              type="button"
              onClick={handlePlaceOrder}
              disabled={orderCreated || product.countInStock <= 0}
            >
              {orderCreated ? '✓ Order Confirmed' : product.countInStock > 0 ? 'Place Order' : 'Out of Stock'}
            </button>
          </div>
        </section>
 
        {/* ── Product Info Card ── */}
        <section className="seller-card">
          <h2 className="section-title">Product Information</h2>
          <div className="seller-card-inner">
            <div className="seller-avatar-large">
              {(product.brand || 'P').charAt(0)}
            </div>
            <div className="seller-card-info">
              <h3 className="seller-card-name">{product.brand || 'Product Brand'}</h3>
              <StarRating rating={product.rating || 0} />
              <p className="seller-sales">{product.reviews || 0} customer reviews</p>
            </div>
            <Link to="/products" className="view-shop-btn">
              Browse More
            </Link>
          </div>
        </section>
 
        {/* ── Reviews Placeholder ── */}
        <section className="reviews-section">
          <h2 className="section-title">Customer Reviews</h2>
          <div className="reviews-placeholder">
            <p className="reviews-placeholder-title">No reviews yet</p>
            <p className="reviews-placeholder-sub">
              Be the first to review this product
            </p>
          </div>
        </section>
 
      </main>
    </div>
  );
}
 
export default ProductDetail;
 