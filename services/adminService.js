import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

class AdminService {
  async getDashboardStats() {
    try {
      const response = await axios.get(`${API_URL}/api/admin/stats`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to fetch stats' };
    }
  }

  async getUsers(params = {}) {
    try {
      const response = await axios.get(`${API_URL}/api/admin/users`, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to fetch users' };
    }
  }

  async updateUser(userId, updates) {
    try {
      const response = await axios.put(`${API_URL}/api/admin/users`, {
        userId,
        updates
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to update user' };
    }
  }
}

export default new AdminService();