class PackageTemplateService {
  async getTemplates(type = null) {
    try {
      const url = type ? `/api/package-templates?type=${type}` : '/api/package-templates';
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Get templates error:', error);
      throw error;
    }
  }

  async createTemplate(templateData) {
    try {
      const response = await fetch('/api/package-templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(templateData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create template');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Create template error:', error);
      throw error;
    }
  }

  async updateTemplate(id, templateData) {
    try {
      const response = await fetch(`/api/package-templates/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(templateData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update template');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Update template error:', error);
      throw error;
    }
  }

  async deleteTemplate(id) {
    try {
      const response = await fetch(`/api/package-templates/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete template');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Delete template error:', error);
      throw error;
    }
  }

  async uploadPackageImages(files) {
    try {
      const formData = new FormData();
      
      // Add all files to FormData
      for (let i = 0; i < files.length; i++) {
        formData.append('images', files[i]);
      }
      
      const response = await fetch('/api/upload/package-images', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload images');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Upload images error:', error);
      throw error;
    }
  }
}

export default new PackageTemplateService();