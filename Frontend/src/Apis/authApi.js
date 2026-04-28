const API_URL = 'http://localhost:5000/api/auth';

export const registerUser = async (userData) => {
    const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
    });
    return response.json();
};

export const loginUser = async (credentials) => {
    const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
    });
    return response.json();
};

export const getMe = async () => {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/get-user`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.json();
    } catch (error) {
        console.error('Error fetching user:', error.response?.data || error.message);
        throw error;
    }
};