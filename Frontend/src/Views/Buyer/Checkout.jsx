import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import Navbar from '../../Components/Navbar';
import Footer from '../../Components/Footer';
import { Store, ShoppingCart, Trash2, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Checkout.css';

const Checkout = () => {
  const { cartItems, removeFromCart, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [formErrors, setFormErrors] = useState({});
  const [step, setStep] = useState(1); // Step 1: Cart, Step 2: Details, Step 3: Review

  const [shippingDetails, setShippingDetails] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India'
  });

  // Group items by seller_id
  const groupedItems = cartItems.reduce((acc, item) => {
    const sellerId = item.seller_id;
    if (!acc[sellerId]) {
      acc[sellerId] = {
        seller: item.seller,
        seller_id: item.seller_id,
        items: [],
        total: 0
      };
    }
    acc[sellerId].items.push(item);
    acc[sellerId].total += (item.price * item.quantity);
    return acc;
  }, {});

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = Object.keys(groupedItems).length * 5; // $5 per seller
  const total = subtotal + shipping;

  const validateForm = () => {
    const errors = {};
    if (!shippingDetails.firstName.trim()) errors.firstName = 'First name is required';
    if (!shippingDetails.lastName.trim()) errors.lastName = 'Last name is required';
    if (!shippingDetails.email.trim()) errors.email = 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shippingDetails.email)) errors.email = 'Invalid email format';
    if (!shippingDetails.phone.trim()) errors.phone = 'Phone number is required';
    if (!/^\d{10,}$/.test(shippingDetails.phone.replace(/\D/g, ''))) errors.phone = 'Invalid phone number';
    if (!shippingDetails.addressLine1.trim()) errors.addressLine1 = 'Address is required';
    if (!shippingDetails.city.trim()) errors.city = 'City is required';
    if (!shippingDetails.state.trim()) errors.state = 'State is required';
    if (!shippingDetails.postalCode.trim()) errors.postalCode = 'Postal code is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setShippingDetails(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleContinueToDetails = () => {
    setStep(2);
  };

  const handleContinueToReview = () => {
    if (validateForm()) {
      setStep(3);
    } else {
      alert('Please fill in all required fields correctly');
    }
  };

  const handleConfirmOrder = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      const orderPromises = Object.values(groupedItems).map(async (group) => {
        const orderItems = group.items.map(i => ({
            listing_id: i.listing_id,
            quantity: i.quantity,
            price: i.price
        }));

        const response = await fetch('http://localhost:5000/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            seller_id: group.seller_id,
            items: orderItems,
            totalAmount: group.total + 5, // item total + shipping
            shippingDetails: shippingDetails
          })
        });

        if (!response.ok) {
           throw new Error('Failed to place order for seller: ' + group.seller);
        }
      });

      await Promise.all(orderPromises);
      clearCart();
      navigate('/orders');
    } catch (err) {
      console.error(err);
      alert('There was an error placing your order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="checkout-page">
        <div className="checkout-container">
          {step === 1 ? (
            // STEP 1: Cart Review Only
            <>
              <header className="checkout-header">
                <h1 className="checkout-title">Your Cart</h1>
                <p className="text-secondary">Review your items before proceeding to checkout.</p>
              </header>

              {cartItems.length === 0 ? (
                <div className="empty-cart">
                  <ShoppingCart size={48} className="empty-icon" />
                  <h2>Your cart is empty</h2>
                  <p>Looks like you haven't added anything yet.</p>
                  <button className="confirm-order-btn" onClick={() => navigate('/products')} style={{maxWidth: '250px', margin: '20px auto 0'}}>
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <div className="checkout-content">
                  <div className="checkout-items-wrapper">
                    {/* Order Items by Seller */}
                    {Object.values(groupedItems).map((group) => (
                      <div key={group.seller_id} className="seller-group">
                        
                        {group.items.map(item => (
                          <div key={item.listing_id} className="checkout-item">
                            <img src={item.image} alt={item.name} className="checkout-item-img" />
                            <div className="checkout-item-info">
                              <h3 className="checkout-item-name">{item.name}</h3>
                              <div className="checkout-item-meta">
                                Qty: {item.quantity}
                              </div>
                              <div className="checkout-item-price">${(item.price * item.quantity).toFixed(2)}</div>
                            </div>
                            <button className="remove-btn" onClick={() => removeFromCart(item.listing_id)}>
                              <Trash2 size={18} />
                            </button>
                          </div>
                        ))}
                        <div className="summary-row mt-3 pt-3" style={{borderTop: '1px solid var(--co-border)'}}>
                           <span>Seller Subtotal:</span>
                           <strong>${group.total.toFixed(2)}</strong>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="checkout-sidebar">
                    <div className="checkout-summary">
                      <h2 className="summary-title">Order Summary</h2>
                      <div className="summary-row">
                        <span>Subtotal</span>
                        <span>${subtotal.toFixed(2)}</span>
                      </div>
                      <div className="summary-row">
                        <span>Shipping ({Object.keys(groupedItems).length} sellers)</span>
                        <span>${shipping.toFixed(2)}</span>
                      </div>
                      <div className="summary-total">
                        <span>Total</span>
                        <span>${total.toFixed(2)}</span>
                      </div>

                      <button 
                        className="confirm-order-btn" 
                        onClick={handleContinueToDetails}
                      >
                        Confirm Order
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : step === 2 ? (
            // STEP 2: Enter Details
            <>
              <header className="checkout-header">
                <button className="back-btn" onClick={() => setStep(1)}>
                  <ChevronLeft size={20} /> Back
                </button>
                <h1 className="checkout-title">Delivery Address</h1>
                <p className="text-secondary">Enter your delivery details to continue.</p>
              </header>

              <div className="checkout-content">
                <div className="checkout-items-wrapper">
                  {/* Shipping Details Form */}
                  <div className="shipping-details-section">
                    <div className="form-grid">
                      <div className="form-group">
                        <label htmlFor="firstName">First Name *</label>
                        <input
                          type="text"
                          id="firstName"
                          name="firstName"
                          value={shippingDetails.firstName}
                          onChange={handleInputChange}
                          placeholder="John"
                          className={formErrors.firstName ? 'input-error' : ''}
                        />
                        {formErrors.firstName && <span className="error-text">{formErrors.firstName}</span>}
                      </div>
                      <div className="form-group">
                        <label htmlFor="lastName">Last Name *</label>
                        <input
                          type="text"
                          id="lastName"
                          name="lastName"
                          value={shippingDetails.lastName}
                          onChange={handleInputChange}
                          placeholder="Doe"
                          className={formErrors.lastName ? 'input-error' : ''}
                        />
                        {formErrors.lastName && <span className="error-text">{formErrors.lastName}</span>}
                      </div>
                      <div className="form-group">
                        <label htmlFor="email">Email *</label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={shippingDetails.email}
                          onChange={handleInputChange}
                          placeholder="john@example.com"
                          className={formErrors.email ? 'input-error' : ''}
                        />
                        {formErrors.email && <span className="error-text">{formErrors.email}</span>}
                      </div>
                      <div className="form-group">
                        <label htmlFor="phone">Phone Number *</label>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          value={shippingDetails.phone}
                          onChange={handleInputChange}
                          placeholder="+91 98765 43210"
                          className={formErrors.phone ? 'input-error' : ''}
                        />
                        {formErrors.phone && <span className="error-text">{formErrors.phone}</span>}
                      </div>
                      <div className="form-group full-width">
                        <label htmlFor="addressLine1">Address Line 1 *</label>
                        <input
                          type="text"
                          id="addressLine1"
                          name="addressLine1"
                          value={shippingDetails.addressLine1}
                          onChange={handleInputChange}
                          placeholder="123 Main Street"
                          className={formErrors.addressLine1 ? 'input-error' : ''}
                        />
                        {formErrors.addressLine1 && <span className="error-text">{formErrors.addressLine1}</span>}
                      </div>
                      <div className="form-group full-width">
                        <label htmlFor="addressLine2">Address Line 2 (Optional)</label>
                        <input
                          type="text"
                          id="addressLine2"
                          name="addressLine2"
                          value={shippingDetails.addressLine2}
                          onChange={handleInputChange}
                          placeholder="Apt, Suite, etc."
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="city">City *</label>
                        <input
                          type="text"
                          id="city"
                          name="city"
                          value={shippingDetails.city}
                          onChange={handleInputChange}
                          placeholder="Mumbai"
                          className={formErrors.city ? 'input-error' : ''}
                        />
                        {formErrors.city && <span className="error-text">{formErrors.city}</span>}
                      </div>
                      <div className="form-group">
                        <label htmlFor="state">State *</label>
                        <input
                          type="text"
                          id="state"
                          name="state"
                          value={shippingDetails.state}
                          onChange={handleInputChange}
                          placeholder="Maharashtra"
                          className={formErrors.state ? 'input-error' : ''}
                        />
                        {formErrors.state && <span className="error-text">{formErrors.state}</span>}
                      </div>
                      <div className="form-group">
                        <label htmlFor="postalCode">Postal Code *</label>
                        <input
                          type="text"
                          id="postalCode"
                          name="postalCode"
                          value={shippingDetails.postalCode}
                          onChange={handleInputChange}
                          placeholder="400001"
                          className={formErrors.postalCode ? 'input-error' : ''}
                        />
                        {formErrors.postalCode && <span className="error-text">{formErrors.postalCode}</span>}
                      </div>
                      <div className="form-group">
                        <label htmlFor="country">Country *</label>
                        <input
                          type="text"
                          id="country"
                          name="country"
                          value={shippingDetails.country}
                          onChange={handleInputChange}
                          disabled
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="checkout-sidebar">
                  <div className="checkout-summary">
                    <h2 className="summary-title">Order Summary</h2>
                    <div className="summary-row">
                      <span>Subtotal</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="summary-row">
                      <span>Shipping ({Object.keys(groupedItems).length} sellers)</span>
                      <span>${shipping.toFixed(2)}</span>
                    </div>
                    <div className="summary-total">
                      <span>Total</span>
                      <span>${total.toFixed(2)}</span>
                    </div>

                    <button 
                      className="confirm-order-btn" 
                      onClick={handleContinueToReview}
                    >
                      Review Order
                    </button>

                    
                  </div>
                </div>
              </div>
            </>
          ) : (
            // STEP 3: Review & Checkout
            <>
              <header className="checkout-header">
                <button className="back-btn" onClick={() => setStep(2)}>
                  <ChevronLeft size={20} /> Back
                </button>
                <h1 className="checkout-title">Review Your Order</h1>
                <p className="text-secondary">Please verify your details before placing your order.</p>
              </header>

              <div className="checkout-content review-layout">
                <div className="checkout-items-wrapper">
                  {/* Delivery Details Review */}
                  <div className="review-section">
                    <div className="section-header">
                      <h2 className="section-title">Delivery Details</h2>
                      <button className="edit-btn" onClick={() => setStep(2)}>Edit</button>
                    </div>
                    <div className="review-details-card">
                      <div className="detail-row">
                        <span className="detail-label">Name:</span>
                        <span className="detail-value">{shippingDetails.firstName} {shippingDetails.lastName}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Email:</span>
                        <span className="detail-value">{shippingDetails.email}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Phone:</span>
                        <span className="detail-value">{shippingDetails.phone}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Address:</span>
                        <span className="detail-value">
                          {shippingDetails.addressLine1}
                          {shippingDetails.addressLine2 && <>, {shippingDetails.addressLine2}</>}
                          <br />{shippingDetails.city}, {shippingDetails.state} {shippingDetails.postalCode}
                          <br />{shippingDetails.country}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Order Items Review */}
                  <div className="review-section">
                    <h2 className="section-title">Order Items</h2>
                    {Object.values(groupedItems).map((group) => (
                      <div key={group.seller_id} className="seller-group review-mode">
                        
                        {group.items.map(item => (
                          <div key={item.listing_id} className="checkout-item review-item">
                            <img src={item.image} alt={item.name} className="checkout-item-img" />
                            <div className="checkout-item-info">
                              <h3 className="checkout-item-name">{item.name}</h3>
                              <div className="checkout-item-meta">
                                Qty: {item.quantity} × ${item.price.toFixed(2)}
                              </div>
                            </div>
                            <div className="checkout-item-price">${(item.price * item.quantity).toFixed(2)}</div>
                          </div>
                        ))}
                        <div className="summary-row mt-3 pt-3" style={{borderTop: '1px solid var(--co-border)'}}>
                           <span>Subtotal:</span>
                           <strong>${group.total.toFixed(2)}</strong>
                        </div>
                        <div className="summary-row" style={{fontSize: '0.9rem', color: 'var(--co-text-secondary)'}}>
                           <span>Shipping:</span>
                           <strong>$5.00</strong>
                        </div>
                        <div className="summary-row" style={{fontSize: '1.1rem', fontWeight: '700', borderTop: '1px dashed var(--co-border)', paddingTop: '10px', marginTop: '10px'}}>
                           <span>Total:</span>
                           <strong>${(group.total + 5).toFixed(2)}</strong>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="checkout-sidebar">
                  <div className="checkout-summary review-summary">
                    <h2 className="summary-title">Order Summary</h2>
                    <div className="summary-row">
                      <span>Subtotal</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="summary-row">
                      <span>Shipping ({Object.keys(groupedItems).length} sellers × $5)</span>
                      <span>${shipping.toFixed(2)}</span>
                    </div>
                    <div className="summary-total">
                      <span>Total Amount</span>
                      <span>${total.toFixed(2)}</span>
                    </div>

                    <button 
                      className="confirm-order-btn" 
                      onClick={handleConfirmOrder}
                      disabled={loading}
                    >
                      {loading ? 'Processing...' : 'Confirm Order'}
                    </button>

                    <button 
                      className="secondary-btn" 
                      onClick={() => setStep(2)}
                      disabled={loading}
                    >
                      Back to Edit
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Checkout;
