import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

class AuthService {
  async register(userData) {
    try {
      const response = await axios.post(`${API_URL}/api/auth/register`, userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Registration failed' };
    }
  }

  async login(credentials) {
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, credentials);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Login failed' };
    }
  }

  async logout() {
    try {
      const response = await axios.post(`${API_URL}/api/auth/logout`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Logout failed' };
    }
  }

  async getCurrentUser() {
    try {
      const response = await axios.get(`${API_URL}/api/auth/me`);
      return response.data;
    } catch (error) {
      return null;
    }
  }
}

export default new AuthService();