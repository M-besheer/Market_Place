import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom'
import { getIncomingOrders, updateOrderStatus, flagBuyer} from '../../Apis/Seller'; // Ensure this path matches your project structure
import { getMe } from '../../Apis/authApi'; // New API call to fetch user info
import './Seller.css';
import LoadingScreen from '../Loading';
import Navbar from '../Navbar/Navbar';

export default function OrderView() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate()

    // Modal & Filter State
    const [selectedOrderNumber, setSelectedOrderNumber] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [selectedStatus, setSelectedStatus] = useState(null);
    const [sellerName, setSellerName] = useState(''); // New state for seller's name
    const [error, setError] = useState(null);


    // Fetch orders when the component loads
    useEffect(() => {
        const fetchUser = async () => {
            try{
                const user = await getMe();
                setSellerName(user.firstName);
            } catch (error) {
                setError({
                    message: "Unable to load seller information. Please contact the developer.",
                    details: error.message
                });
            }
        };

        const fetchOrders = async () => {
            try {
                const data = await getIncomingOrders();
                setOrders(data);
            } catch (error) {
                setError({
                    message: "Unable to load orders. Please contact the developer.",
                    details: error.message
                });
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
        fetchOrders();
    }, []);

    // Filter and search logic
    const filteredOrders = useMemo(() => {
        return orders.filter((order) => {
            const searchStr = searchTerm.toLowerCase();
            
            // Map search to MongoDB _id and the Listing Title (since we bypassed the User model)
            const matchesSearch =
                (order._id && order._id.toLowerCase().includes(searchStr)) ||
                (order.listing_id?.title && order.listing_id.title.toLowerCase().includes(searchStr));

            const matchesStatus = statusFilter === '' || order.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [orders, searchTerm, statusFilter]);

    // Open Modal
    const handleUpdateStatusClick = (orderNumber) => {
        setSelectedOrderNumber(orderNumber);
        // Find the current status of the order using the order number
        const order = orders.find(o => o.orderNumber === orderNumber);
        if (order) {
            setSelectedStatus(order.status);
        }
    };

    // Close Modal
    const closeModal = () => {
        setSelectedOrderNumber(null);
        setSelectedStatus(null);
    };

    // Execute API call and update UI
    const handleSaveStatus = async () => {
        if (selectedStatus && selectedOrderNumber) {
            try {
                // 1. Send update to the backend
                await updateOrderStatus(selectedOrderNumber, selectedStatus);

                // 2. If successful, update the local UI state
                setOrders(orders.map(order =>
                    order.orderNumber === selectedOrderNumber
                        ? { ...order, status: selectedStatus }
                        : order
                ));
                closeModal();
            } catch (error) {
                setError({
                    message: "Failed to update order status. Check console for details.",
                    details: error.message
                });
            }
        }
    };

    // Handle flagging buyer
    const handleFlagBuyer = async (orderNumber, flag) => {
        try {
            const response = await flagBuyer(orderNumber, flag);
            // Backend returns buyer stats in response.buyer with camelCase keys
            const { upVotes, downVotes } = response.buyer || {};

            setOrders(orders.map(order =>
                order.orderNumber === orderNumber
                    ? { 
                        ...order, 
                        sellerFlag: response.order?.sellerFlag,
                        buyer_id: {
                            ...order.buyer_id,
                            upVotes: upVotes,
                            downVotes: downVotes
                        }
                    }
                    : order
            ));
        } catch (error) {
            setError({
                message: "Failed to flag buyer. Check console for details.",
                details: error.message
            });
        }
    };

    if (loading) return <LoadingScreen />;

    return (
        error ? (
            <div className="error-message full-page">
                <h2>{error.message}</h2>
                <pre>{error.details}</pre>
                <button onClick={() => window.location.reload()}>Retry</button>
            </div>
        ) : (
        <div className="seller-dashboard">
            <Navbar role="seller" name={sellerName} />

            {/* Main Content */}
            <div className="dashboard-content">
                {/* Top Section with Title and Controls */}
                <div className="dashboard-header">
                    <div className="header-left">
                        <h1>Your Sales Orders</h1>
                        <p className="subtitle">Track and manage all incoming orders</p>
                    </div>
                    <div className="header-right">
                        <div className="search-group">
                            <input
                                type="text"
                                placeholder="Search order ID or Item Title..."
                                className="form-input"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                            <option value="">All Status</option>
                            <option value="Pending">Pending</option>
                            <option value="Processing">Processing</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                        </select>
                    </div>
                </div>

                {/* Orders Card */}
                <div className="orders-card">
                    <div className="card-header">
                        <h2>Recent Orders</h2>
                        <span className="order-count">
                            {filteredOrders.length} of {orders.length} orders
                        </span>
                    </div>

                    {/* No Results Message */}
                    {filteredOrders.length === 0 ? (
                        <div className="no-results">
                            <span className="no-results-icon">📭</span>
                            <p>No orders found</p>
                            <small>Try adjusting your search or filters</small>
                        </div>
                    ) : (
                        /* Orders List */
                        <div className="orders-list">
                            {filteredOrders.map((order) => (
                                <div key={order._id} className="order-card">
                                    
                                    {/* LEFT COLUMN: The Image */}
                                    <div className="order-image-container">
                                        {order.listing_id?.image_urls && order.listing_id.image_urls.length > 0 ? (
                                            <img 
                                                src={order.listing_id.image_urls[0]} 
                                                alt={order.listing_id?.title || 'Item'} 
                                                className="order-thumbnail"
                                            />
                                        ) : (
                                            <div className="order-thumbnail placeholder">
                                                <span>📷</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* RIGHT COLUMN: All Order Info and Actions */}
                                    <div className="order-info-container">
                                        
                                        {/* Header (ID, Status, Price) */}
                                        <div className="order-header-row">
                                            <div className="order-id-section">
                                                <span className="order-id">Order ID: {order.orderNumber}</span>
                                                <span className={`status-badge badge-${order.status}`}>
                                                    {order.status.toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="order-amount">
                                                ${order.listing_id?.price?.toFixed(2) || '0.00'}
                                            </div>
                                        </div>

                                        {/* Details (Item Name, Date, Customer) */}
                                        <div className="order-details">
                                            <div className="detail-item">
                                                <span className="detail-label">Item</span>
                                                <span className="detail-value text-primary">
                                                    {order.listing_id?.title || 'Unknown Item'}
                                                </span>
                                            </div>
                                            <div className="detail-item">
                                                <span className="detail-label">Date</span>
                                                <span className="detail-value">
                                                    {new Date(order.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <div className="detail-item">
                                                <span className="detail-label">Customer Name</span>
                                                <span className="detail-value text-muted">
                                                    {order.buyer_id?.firstName} {order.buyer_id?.lastName}
                                                    
                                                    {/* REPUTATION SECTION */}
                                                    <span className="customer-reputation" style={{ marginLeft: '10px', fontSize: '0.9em' }}>
                                                        <span title="Total Good Flags">
                                                            👍🏻 {order.buyer_id?.upVotes || 0}
                                                        </span>
                                                        <span title="Total Bad Flags" style={{ marginLeft: '8px' }}>
                                                            👎🏻 {order.buyer_id?.downVotes || 0}
                                                        </span>
                                                    </span>
                                                </span>
                                            </div>
                                        </div>

                                        {/* Actions (Buttons) */}
                                        <div className="order-actions">
                                            <button className="action-btn btn-view">
                                                View Details
                                            </button>
                                            <button
                                                className="action-btn btn-update"
                                                onClick={() => handleUpdateStatusClick(order.orderNumber)}
                                            >
                                                ✎ Update Status
                                            </button>
                                            <div className="flag-buttons">
                                                <p>
                                                    🚩 Flag User
                                                </p>
                                                <button
                                                    className={`flag-btn flag-good ${order.sellerFlag === 'good' ? 'active' : 'inactive'}`}
                                                    onClick={() => handleFlagBuyer(order.orderNumber, 'good')}
                                                    title={order.sellerFlag === 'good' ? 'Remove good vote' : 'Flag buyer as good'}
                                                >
                                                    👍🏻
                                                </button>
                                                <button
                                                    className={`flag-btn flag-bad ${order.sellerFlag === 'bad' ? 'active' : 'inactive'}`}
                                                    onClick={() => handleFlagBuyer(order.orderNumber, 'bad')}
                                                    title={order.sellerFlag === 'bad' ? 'Remove bad vote' : 'Flag buyer as bad'}
                                                >
                                                    👎🏻
                                                </button>
                                            </div>
                                        </div>
                                        
                                    </div> {/* End of Right Column */}

                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            {selectedOrderNumber && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="update-status-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Update Status</h2>
                            <button className="close-btn" onClick={closeModal}>✕</button>
                        </div>

                        <div className="modal-content">
                            <p>Order: <strong>{selectedOrderNumber}</strong></p>

                            <div className="status-options">
                                {/* Added checked and onChange handlers to the radio buttons to link them to React state */}
                                <label><input type="radio" name="status" value="Pending" checked={selectedStatus === 'Pending'} onChange={(e) => setSelectedStatus(e.target.value)} /> Pending</label>
                                <label><input type="radio" name="status" value="Processing" checked={selectedStatus === 'Processing'} onChange={(e) => setSelectedStatus(e.target.value)} /> Processing</label>
                                <label><input type="radio" name="status" value="Shipped" checked={selectedStatus === 'Shipped'} onChange={(e) => setSelectedStatus(e.target.value)} /> Shipped</label>
                                <label><input type="radio" name="status" value="Delivered" checked={selectedStatus === 'Delivered'} onChange={(e) => setSelectedStatus(e.target.value)} /> Delivered</label>
                                <label><input type="radio" name="status" value="Cancelled" checked={selectedStatus === 'Cancelled'} onChange={(e) => setSelectedStatus(e.target.value)} /> Cancelled</label>
                            </div>

                            <div className="modal-actions">
                                <button className="btn-cancel" onClick={closeModal}>Cancel</button>
                                <button className="btn-save" onClick={handleSaveStatus}>Save Changes</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
        )
    );
}