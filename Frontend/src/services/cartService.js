import axios from 'axios';

const API_URL = 'http://localhost:5000/api/cart';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const fetchCart = async () => {
  const response = await axios.get(API_URL, { headers: getAuthHeader() });
  return response.data;
};

export const addItemToCart = async (listing_id, quantity) => {
  const response = await axios.post(`${API_URL}/add`, { listing_id, quantity }, { headers: getAuthHeader() });
  return response.data;
};

export const updateItemQuantity = async (listing_id, quantity) => {
  const response = await axios.put(`${API_URL}/update`, { listing_id, quantity }, { headers: getAuthHeader() });
  return response.data;
};

export const removeItemFromCart = async (listing_id) => {
  const response = await axios.delete(`${API_URL}/${listing_id}`, { headers: getAuthHeader() });
  return response.data;
};

export const clearUserCart = async () => {
  const response = await axios.delete(API_URL, { headers: getAuthHeader() });
  return response.data;
};
