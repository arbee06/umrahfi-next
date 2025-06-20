import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

class PackageService {
  async getPackages(params = {}) {
    try {
      const response = await axios.get(`${API_URL}/api/packages`, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to fetch packages' };
    }
  }

  async getPackageById(id) {
    try {
      const response = await axios.get(`${API_URL}/api/packages/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to fetch package' };
    }
  }

  async createPackage(packageData) {
    try {
      const response = await axios.post(`${API_URL}/api/packages`, packageData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to create package' };
    }
  }

  async updatePackage(id, packageData) {
    try {
      const response = await axios.put(`${API_URL}/api/packages/${id}`, packageData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to update package' };
    }
  }

  async deletePackage(id) {
    try {
      const response = await axios.delete(`${API_URL}/api/packages/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to delete package' };
    }
  }

  async updatePackageStatus(id, status) {
    try {
      const response = await axios.patch(`${API_URL}/api/packages/${id}/status`, { status });
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to update package status' };
    }
  }
}

export default new PackageService();