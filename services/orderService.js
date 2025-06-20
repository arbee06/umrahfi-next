import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

class OrderService {
  async getOrders(params = {}) {
    try {
      const response = await axios.get(`${API_URL}/api/orders`, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to fetch orders' };
    }
  }

  async getOrderById(id) {
    try {
      const response = await axios.get(`${API_URL}/api/orders/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to fetch order' };
    }
  }

  async createOrder(orderData) {
    try {
      const response = await axios.post(`${API_URL}/api/orders`, orderData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to create order' };
    }
  }

  async updateOrder(id, updateData) {
    try {
      const response = await axios.put(`${API_URL}/api/orders/${id}`, updateData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to update order' };
    }
  }
}

export default new OrderService();