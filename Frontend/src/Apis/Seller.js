import axios from 'axios';

// Set your base URL. Adjust the port if your backend runs on something other than 5000.
const API_BASE_URL = 'http://localhost:5000/api/orders';

export const getIncomingOrders = async () => {
    try {
        const token = localStorage.getItem('token');
        console.log("Fetching incoming orders with token:", token);
        const response = await axios.get(`${API_BASE_URL}/incoming`,{
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching incoming orders:", error.response?.data || error.message);
        throw error;
    }
};


export const updateOrderStatus = async (orderNumber, status) => {
    try {
        const token = localStorage.getItem('token');
        console.log(`Updating order ${orderNumber} to status "${status}" with token:`, token);
        const response = await axios.put(`${API_BASE_URL}/${orderNumber}/status`, {
            status: status
        }, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        console.error(`Error updating order ${orderNumber}:`, error.response?.data || error.message);
        throw error;
    }
};