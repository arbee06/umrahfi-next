import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import packageTemplateService from '@/services/packageTemplateService';
import Icon from '@/components/FontAwesome';
import soundManager from '@/utils/soundUtils';
import Swal from 'sweetalert2';

export default function PackageTemplates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'inclusions',
    items: [''],
    isDefault: false
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const response = await packageTemplateService.getTemplates();
      setTemplates(response.templates);
    } catch (error) {
      console.error('Error fetching templates:', error);
      Swal.fire('Error', 'Failed to fetch templates', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = filter === 'all' 
    ? templates 
    : templates.filter(t => t.type === filter);

  const handleCreateTemplate = () => {
    setEditingTemplate(null);
    setFormData({
      name: '',
      description: '',
      type: 'inclusions',
      items: [''],
      isDefault: false
    });
    setShowCreateModal(true);
  };

  const handleEditTemplate = (template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || '',
      type: template.type,
      items: [...template.items],
      isDefault: template.isDefault
    });
    setShowCreateModal(true);
  };

  const handleDeleteTemplate = async (template) => {
    const result = await Swal.fire({
      title: 'Delete Template?',
      html: `
        <div style="text-align: left; margin: 1rem 0;">
          <p style="margin-bottom: 0.5rem; color: #6b7280;">Template:</p>
          <p style="font-weight: 600; color: #1f2937; margin-bottom: 1rem;">${template.name}</p>
          <div style="background: #fef2f2; padding: 1rem; border-radius: 0.5rem; border: 1px solid #fecaca;">
            <p style="color: #dc2626; margin: 0; font-size: 0.9rem;">⚠️ This action cannot be undone</p>
          </div>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel',
      reverseButtons: true
    });

    if (!result.isConfirmed) return;

    try {
      await packageTemplateService.deleteTemplate(template.id);
      setTemplates(templates.filter(t => t.id !== template.id));
      soundManager.playAction();
      
      Swal.fire({
        title: 'Deleted!',
        text: 'Template deleted successfully',
        icon: 'success',
        timer: 3000,
        timerProgressBar: true,
        toast: true,
        position: 'top-end',
        showConfirmButton: false
      });
    } catch (error) {
      Swal.fire('Error', 'Failed to delete template', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Filter out empty items
    const cleanedItems = formData.items.filter(item => item.trim() !== '');
    
    if (cleanedItems.length === 0) {
      Swal.fire('Error', 'Please add at least one item', 'error');
      return;
    }

    const templateData = {
      ...formData,
      items: cleanedItems
    };

    try {
      if (editingTemplate) {
        await packageTemplateService.updateTemplate(editingTemplate.id, templateData);
        setTemplates(templates.map(t => 
          t.id === editingTemplate.id 
            ? { ...t, ...templateData }
            : t
        ));
      } else {
        const response = await packageTemplateService.createTemplate(templateData);
        setTemplates([...templates, response.template]);
      }
      
      soundManager.playAction();
      setShowCreateModal(false);
      
      Swal.fire({
        title: 'Success!',
        text: `Template ${editingTemplate ? 'updated' : 'created'} successfully`,
        icon: 'success',
        timer: 3000,
        timerProgressBar: true,
        toast: true,
        position: 'top-end',
        showConfirmButton: false
      });
    } catch (error) {
      Swal.fire('Error', error.message || 'Failed to save template', 'error');
    }
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, '']
    });
  };

  const removeItem = (index) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    });
  };

  const updateItem = (index, value) => {
    const newItems = [...formData.items];
    newItems[index] = value;
    setFormData({
      ...formData,
      items: newItems
    });
  };

  return (
    <ProtectedRoute allowedRoles={['company']}>
      <Layout>
        <div className="company-template-management-container">
          <div className="company-template-management-background">
            <div className="company-template-management-pattern"></div>
            <div className="company-template-management-gradient"></div>
          </div>
          
          {/* Header */}
          <div className="company-template-management-header">
            <div className="company-template-management-header-content">
              <div className="company-template-management-header-text">
                {/* <div className="company-template-management-breadcrumb">
                  <Icon icon="building" />
                  <span>Company</span>
                  <Icon icon="chevron-right" />
                  <span>Package Templates</span>
                </div> */}
                <h1 className="company-template-management-title">Package Templates</h1>
                <p className="company-template-management-subtitle">
                  Create and manage reusable templates for package inclusions and exclusions
                </p>
              </div>
              <button
                onClick={handleCreateTemplate}
                className="company-template-management-create-btn"
              >
                <Icon icon="plus" />
                Create Template
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="company-template-management-filters">
            <div className="company-template-management-filter-item">
              <label className="company-template-management-filter-label">
                <Icon icon="filter" />
                Filter by type
              </label>
              <select 
                value={filter} 
                onChange={(e) => setFilter(e.target.value)}
                className="company-template-management-select"
              >
                <option value="all">All Types</option>
                <option value="inclusions">Inclusions</option>
                <option value="exclusions">Exclusions</option>
              </select>
            </div>
          </div>

          {/* Templates Grid */}
          <div className="company-template-management-content">
            {loading ? (
              <div className="company-template-management-loading-state">
                <div className="company-template-management-loading-spinner"></div>
                <span>Loading templates...</span>
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="company-template-management-empty-state">
                <div className="company-template-management-empty-icon">
                  <Icon icon="list" />
                </div>
                <h3>No templates found</h3>
                <p>Create your first template to get started</p>
                <button
                  onClick={handleCreateTemplate}
                  className="btn btn-primary"
                >
                  <Icon icon="plus" />
                  Create Template
                </button>
              </div>
            ) : (
              <div className="company-template-management-grid">
                {filteredTemplates.map((template) => (
                  <div key={template.id} className="company-template-management-card">
                    <div className="company-template-management-card-header">
                      <div className={`company-template-management-status-badge ${template.type}`}>
                        <Icon icon={template.type === 'inclusions' ? 'check-circle' : 'times'} />
                        {template.type}
                      </div>
                      {template.isDefault && (
                        <div className="company-template-management-default-badge">
                          <Icon icon="star" />
                          Default
                        </div>
                      )}
                    </div>

                    <div className="company-template-management-card-content">
                      <div className="company-template-management-package-info">
                        <h3 className="company-template-management-package-title">{template.name}</h3>
                        {template.description && (
                          <p className="company-template-management-package-description">
                            {template.description}
                          </p>
                        )}
                      </div>

                      <div className="company-template-management-items-preview">
                        <div className="company-template-management-items-count">
                          <Icon icon="list" />
                          {template.items.length} items
                        </div>
                        <div className="company-template-management-items-list">
                          {template.items.slice(0, 3).map((item, index) => (
                            <div key={index} className="company-template-management-item-preview">
                              • {item.length > 40 ? item.substring(0, 40) + '...' : item}
                            </div>
                          ))}
                          {template.items.length > 3 && (
                            <div className="company-template-management-items-more">
                              +{template.items.length - 3} more
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="company-template-management-card-footer">
                      <button
                        onClick={() => handleEditTemplate(template)}
                        className="company-template-management-action-btn activate"
                      >
                        <Icon icon="edit" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(template)}
                        className="company-template-management-action-btn deactivate"
                      >
                        <Icon icon="trash" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Create/Edit Modal */}
        {showCreateModal && (
          <div className="company-template-management-modal" onClick={() => setShowCreateModal(false)}>
            <div className="company-template-management-modal-backdrop"></div>
            <div className="company-template-management-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="company-template-management-modal-header">
                <h3 className="company-template-management-modal-title">
                  {editingTemplate ? 'Edit Template' : 'Create Template'}
                </h3>
                <button
                  className="company-template-management-modal-close"
                  onClick={() => setShowCreateModal(false)}
                >
                  <Icon icon="times" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="company-template-management-form">
                <div className="company-template-management-form-grid">
                  <div className="company-template-management-form-group">
                    <label>Template Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="e.g., Standard Inclusions"
                      required
                    />
                  </div>
                  
                  <div className="company-template-management-form-group">
                    <label>Type *</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                      required
                    >
                      <option value="inclusions">Inclusions</option>
                      <option value="exclusions">Exclusions</option>
                    </select>
                  </div>
                </div>

                <div className="company-template-management-form-group">
                  <label>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Optional description for this template"
                    rows="2"
                  />
                </div>

                <div className="company-template-management-form-group">
                  <label>Items *</label>
                  <div className="company-template-management-items-editor">
                    {formData.items.map((item, index) => (
                      <div key={index} className="company-template-management-item-input">
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => updateItem(index, e.target.value)}
                          placeholder={`${formData.type === 'inclusions' ? 'Included' : 'Excluded'} item ${index + 1}`}
                        />
                        {formData.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="company-template-management-remove-item"
                          >
                            <Icon icon="times" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addItem}
                      className="company-template-management-add-item"
                    >
                      <Icon icon="plus" />
                      Add Item
                    </button>
                  </div>
                </div>

                <div className="company-template-management-form-group">
                  <label className="company-template-management-checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.isDefault}
                      onChange={(e) => setFormData({...formData, isDefault: e.target.checked})}
                    />
                    <span>Set as default template for {formData.type}</span>
                  </label>
                </div>

                <div className="company-template-management-form-actions">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                  >
                    {editingTemplate ? 'Update Template' : 'Create Template'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </Layout>
    </ProtectedRoute>
  );
}