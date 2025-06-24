import axios from '@/utils/axiosConfig';

class AuthService {
  async register(userData) {
    try {
      const response = await axios.post('/api/auth/register', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Registration failed' };
    }
  }

  async login(credentials) {
    try {
      const response = await axios.post('/api/auth/login', credentials);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Login failed' };
    }
  }

  async logout() {
    try {
      const response = await axios.post('/api/auth/logout');
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Logout failed' };
    }
  }

  async getCurrentUser() {
    try {
      const response = await axios.get('/api/auth/me');
      return response.data;
    } catch (error) {
      return null;
    }
  }
}

export default new AuthService();