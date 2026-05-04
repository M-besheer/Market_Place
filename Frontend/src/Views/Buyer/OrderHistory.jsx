import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './OrderHistory.css';
import Navbar from '../../Components/Navbar';
import Footer from '../../Components/Footer';

const STATUS_STYLES = {
  Pending:    { color: '#856404', background: '#fff3cd', bar: '#f4c430' },
  Processing: { color: '#084298', background: '#cfe2ff', bar: '#5092e7' },
  Shipped:    { color: '#b35900', background: '#ffe5cc', bar: '#ff8c00' },
  Delivered:  { color: '#0f5132', background: '#d1e7dd', bar: '#1a7f4b' },
  Cancelled:  { color: '#842029', background: '#f8d7da', bar: '#dc3545' },
};

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.Pending;
  return (
    <div className="order-status-wrapper">
      <div className="status-bar-track">
        <div className="status-bar-fill" style={{ background: s.bar, width: getBarWidth(status) }} />
      </div>
      <span className="status-label" style={{ color: s.color, background: s.background }}>
        {status}
      </span>
    </div>
  );
}

function getBarWidth(status) {
  const widths = { Pending: '20%', Processing: '45%', Shipped: '70%', Delivered: '100%', Cancelled: '100%' };
  return widths[status] || '20%';
}

function OrderHistory() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('All');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const filters = ['All', 'Pending', 'Shipped', 'Delivered', 'Cancelled'];

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem('token');

        if (!token) {
          console.warn("No authentication token found");
          setLoading(false);
          return;
        }

        const response = await fetch('http://localhost:5000/api/orders/buyer/my-orders', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          const ordersList = Array.isArray(data) ? data : (data.orders || []);

          // Filter out orders where the product data isn't populated
          const validOrders = ordersList.filter(
            order => order.items && order.items[0]?.listing_id?.title
          );

          setOrders(validOrders);
        } else {
          console.error("Failed to fetch orders:", response.status, response.statusText);
        }
      } catch (error) {
        console.error("Error connecting to backend:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const filtered = filter === 'All'
    ? orders
    : orders.filter(o => o.status === filter);

  return (
    <div className="order-history-page">

      {/* ── Navbar ── */}
      <Navbar />

      <main className="page-body">

        {/* ── Page Header ── */}
        <div className="oh-page-header">
          <div>
            <h1 className="oh-title">My Orders</h1>
            <p className="oh-subtitle">Track and manage all your purchases</p>
          </div>
          <div className="oh-count-badge">{filtered.length} of {orders.length} orders</div>
        </div>

        {/* ── Filter Tabs ── */}
        <div className="oh-filters">
          {filters.map(f => (
            <button
              key={f}
              className={`oh-filter-btn ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>

        {/* ── Orders Card ── */}
        <div className="oh-card">
          <div className="oh-card-header">
            <h2>Recent Orders</h2>
            <span className="oh-order-count">{filtered.length} orders</span>
          </div>

          {loading ? (
            <div className="oh-empty">
              <p>Loading orders...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="oh-empty">
              <div className="oh-empty-icon">&#128230;</div>
              <p>No orders found</p>
              <small>Try a different filter or place a new order</small>
              <button className="oh-shop-btn" onClick={() => navigate('/catalog')}>
                Browse Catalog
              </button>
            </div>
          ) : (
            <div className="oh-orders-list">
              {filtered.map(order => {
                const firstItem = order.items && order.items[0] ? order.items[0] : null;
                const pName = firstItem?.listing_id?.title || 'Unknown Product';
                const pImage = firstItem?.listing_id?.image_urls?.[0] || '';
                const sellerName = order.seller_id?.username || 'Unknown Seller';
                const totalQty = order.items
                  ? order.items.reduce((sum, item) => sum + item.quantity, 0)
                  : 0;

                return (
                  <div key={order._id} className="oh-order-item">

                    {/* Product Image */}
                    <div className="oh-product-image">
                      {pImage
                        ? <img src={pImage} alt={pName} />
                        : <div className="oh-image-placeholder">📦</div>
                      }
                    </div>

                    {/* Order Info */}
                    <div className="oh-order-info">
                      <p className="oh-product-name">
                        {pName} {order.items?.length > 1 ? `(+${order.items.length - 1} more)` : ''}
                      </p>
                      <p className="oh-meta">
                        ${order.totalAmount?.toFixed(2) || '0.00'}
                        &nbsp;·&nbsp; Qty: {totalQty}
                        &nbsp;·&nbsp; Seller: {sellerName}
                        &nbsp;·&nbsp; {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Status */}
                    <StatusBadge status={order.status || 'Pending'} />

                  </div>
                );
              })}
            </div>
          )}
        </div>

      </main>
      <Footer />
    </div>
  );
}

export default OrderHistory;