import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api/categories";

export const getCategories = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/getAll`);
        return response.data;
    } catch (error) {
        console.error("Error fetching categories:", error);
        throw error;
    }
};