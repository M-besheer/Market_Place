import axios from "axios"
const API_BASE_URL = "http://localhost:5000/api/products"

export const fetchProducts = async ({page, category, limit, priceRange,minRating}) => {
    const response = await axios.get(`${API_BASE_URL}?page=${page}&category=${category}&limit=${limit}&priceRange=${priceRange}&minRating=${minRating}`)
    return response.data
}

export const fetchCategories = async () => {
    const response = await axios.get(`${API_BASE_URL}/categories`)
    return response.data
}