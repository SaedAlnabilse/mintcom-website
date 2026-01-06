import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../config/api';
import { ConfirmModal } from '../../components/ConfirmModal';

interface SubAttribute {
  id: string;
  name: string;
  price: number;
  isAvailable: boolean;
  attributeId: string;
}

interface Attribute {
  id: string;
  name: string;
  inputType: 'SINGLE_SELECT' | 'MULTI_SELECT';
  isRequired: boolean;
  subAttributes: SubAttribute[];
}

export function AddonsPage() {
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [showAttributeModal, setShowAttributeModal] = useState(false);
  const [showSubAttributeModal, setShowSubAttributeModal] = useState(false);
  const [editingAttribute, setEditingAttribute] = useState<Attribute | null>(null);
  const [editingSubAttribute, setEditingSubAttribute] = useState<SubAttribute | null>(null);
  const [parentAttributeId, setParentAttributeId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type?: 'danger' | 'success' | 'warning';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { },
  });

  // Form states
  const [attributeForm, setAttributeForm] = useState({
    name: '',
    inputType: 'SINGLE_SELECT' as 'SINGLE_SELECT' | 'MULTI_SELECT',
    isRequired: false,
  });
  const [subAttributeForm, setSubAttributeForm] = useState({
    name: '',
    price: 0,
    isAvailable: true,
  });

  useEffect(() => {
    fetchAttributes();
  }, []);

  const fetchAttributes = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/api/attributes');
      const sorted = (response.data || []).sort((a: Attribute, b: Attribute) =>
        b.id.localeCompare(a.id)
      );
      setAttributes(sorted);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load attributes');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAttributes = attributes.filter((attr) =>
    attr.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    totalAttributes: attributes.length,
    totalOptions: attributes.reduce((sum, attr) => sum + (attr.subAttributes?.length || 0), 0),
    requiredCount: attributes.filter((attr) => attr.isRequired).length,
  };

  // Open attribute modal
  const openAttributeModal = (attribute?: Attribute) => {
    if (attribute) {
      setEditingAttribute(attribute);
      setAttributeForm({
        name: attribute.name,
        inputType: attribute.inputType,
        isRequired: attribute.isRequired,
      });
    } else {
      setEditingAttribute(null);
      setAttributeForm({ name: '', inputType: 'SINGLE_SELECT', isRequired: false });
    }
    setShowAttributeModal(true);
  };

  // Open sub-attribute modal
  const openSubAttributeModal = (attributeId: string, subAttr?: SubAttribute) => {
    setParentAttributeId(attributeId);
    if (subAttr) {
      setEditingSubAttribute(subAttr);
      setSubAttributeForm({
        name: subAttr.name,
        price: subAttr.price,
        isAvailable: subAttr.isAvailable,
      });
    } else {
      setEditingSubAttribute(null);
      setSubAttributeForm({ name: '', price: 0, isAvailable: true });
    }
    setShowSubAttributeModal(true);
  };

  // Save attribute
  const handleSaveAttribute = async () => {
    if (!attributeForm.name.trim()) {
      toast.error('Please enter an attribute name');
      return;
    }
    setIsSubmitting(true);
    try {
      if (editingAttribute) {
        await api.put(`/api/attributes/${editingAttribute.id}`, attributeForm);
        toast.success('Attribute updated');
      } else {
        await api.post('/api/attributes', attributeForm);
        toast.success('Attribute created');
      }
      setShowAttributeModal(false);
      fetchAttributes();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save attribute');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete attribute
  const handleDeleteAttribute = async (id: string) => {
    const attr = attributes.find((a) => a.id === id);
    if (attr && attr.subAttributes?.length > 0) {
      toast.error(`Delete all ${attr.subAttributes.length} option(s) first`);
      return;
    }

    setConfirmConfig({
      isOpen: true,
      title: 'Delete Attribute',
      message: 'Are you sure you want to delete this attribute?',
      type: 'danger',
      onConfirm: async () => {
        try {
          await api.delete(`/api/attributes/${id}`);
          toast.success('Attribute deleted');
          fetchAttributes();
        } catch (err: any) {
          toast.error(err.response?.data?.message || 'Failed to delete');
        }
      }
    });
  };

  // Save sub-attribute
  const handleSaveSubAttribute = async () => {
    if (!subAttributeForm.name.trim()) {
      toast.error('Please enter an option name');
      return;
    }
    if (!parentAttributeId) return;
    setIsSubmitting(true);
    try {
      if (editingSubAttribute) {
        await api.put(`/api/attributes/sub-attributes/${editingSubAttribute.id}`, subAttributeForm);
        toast.success('Option updated');
      } else {
        await api.post(`/api/attributes/${parentAttributeId}/sub-attributes`, subAttributeForm);
        toast.success('Option created');
      }
      setShowSubAttributeModal(false);
      fetchAttributes();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save option');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete sub-attribute
  const handleDeleteSubAttribute = async (subAttrId: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Option',
      message: 'Are you sure you want to delete this option?',
      type: 'danger',
      onConfirm: async () => {
        try {
          await api.delete(`/api/attributes/sub-attributes/${subAttrId}`);
          toast.success('Option deleted');
          fetchAttributes();
        } catch (err: any) {
          toast.error(err.response?.data?.message || 'Failed to delete');
        }
      }
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'JOD',
      minimumFractionDigits: 2,
    }).format(value).replace('JOD', '').trim() + ' JOD';
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-900 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-green-500 text-xs font-semibold tracking-wider uppercase mb-1">Product Customization</p>
          <h1 className="text-2xl font-bold text-white">Add-ons & Attributes</h1>
        </div>
        <button
          onClick={() => openAttributeModal()}
          className="px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Attribute
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <p className="text-2xl font-bold text-white">{stats.totalAttributes}</p>
          <p className="text-gray-400 text-sm">Attributes</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <p className="text-2xl font-bold text-white">{stats.totalOptions}</p>
          <p className="text-gray-400 text-sm">Options</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <p className="text-2xl font-bold text-green-500">{stats.requiredCount}</p>
          <p className="text-gray-400 text-sm">Required</p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search attributes..."
          className="w-full max-w-md px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {/* Attributes List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <svg className="animate-spin h-8 w-8 text-green-500" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      ) : filteredAttributes.length === 0 ? (
        <div className="text-center py-12">
          <svg className="w-16 h-16 mx-auto text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          <p className="text-gray-400">No attributes found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAttributes.map((attr) => (
            <div key={attr.id} className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
              {/* Attribute Header */}
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-700/30 transition-colors"
                onClick={() => setExpandedId(expandedId === attr.id ? null : attr.id)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-white font-semibold">{attr.name}</span>
                    {attr.isRequired && (
                      <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-medium rounded">Required</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-gray-400 flex items-center gap-1">
                      {attr.inputType === 'SINGLE_SELECT' ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <circle cx="12" cy="12" r="10" strokeWidth="2" />
                          <circle cx="12" cy="12" r="4" fill="currentColor" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                      {attr.inputType === 'SINGLE_SELECT' ? 'Single' : 'Multi'}
                    </span>
                    <span className="text-gray-500">•</span>
                    <span className="text-gray-400">{attr.subAttributes?.length || 0} options</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); openAttributeModal(attr); }}
                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteAttribute(attr.id); }}
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                  <svg
                    className={`w-5 h-5 text-gray-400 transform transition-transform ${expandedId === attr.id ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Expanded Content */}
              {expandedId === attr.id && (
                <div className="border-t border-gray-700 bg-gray-800/50 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-gray-400 text-sm font-medium">Options ({attr.subAttributes?.length || 0})</span>
                    <button
                      onClick={() => openSubAttributeModal(attr.id)}
                      className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Option
                    </button>
                  </div>

                  {attr.subAttributes && attr.subAttributes.length > 0 ? (
                    <div className="space-y-2">
                      {attr.subAttributes.map((subAttr) => (
                        <div key={subAttr.id} className="flex items-center justify-between bg-gray-700/50 rounded-lg p-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-white font-medium">{subAttr.name}</span>
                              <span className={`px-2 py-0.5 text-xs font-medium rounded ${subAttr.isAvailable ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                {subAttr.isAvailable ? 'Available' : 'Unavailable'}
                              </span>
                            </div>
                            {subAttr.price > 0 && (
                              <span className="text-green-500 text-sm font-medium">+{formatCurrency(subAttr.price)}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openSubAttributeModal(attr.id, subAttr)}
                              className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-600 rounded transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteSubAttribute(subAttr.id)}
                              className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/20 rounded transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      <svg className="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <p>No options yet</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Attribute Modal */}
      {showAttributeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-md">
            <div className="p-6 border-b border-gray-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">
                {editingAttribute ? 'Edit Attribute' : 'New Attribute'}
              </h2>
              <button onClick={() => setShowAttributeModal(false)} className="text-gray-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Name *</label>
                <input
                  type="text"
                  value={attributeForm.name}
                  onChange={(e) => setAttributeForm({ ...attributeForm, name: e.target.value })}
                  placeholder="e.g., Size, Color, Extras"
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Selection Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAttributeForm({ ...attributeForm, inputType: 'SINGLE_SELECT' })}
                    className={`p-3 rounded-lg border-2 flex items-center justify-center gap-2 transition-colors ${attributeForm.inputType === 'SINGLE_SELECT' ? 'border-green-500 bg-green-500/10 text-green-400' : 'border-gray-600 text-gray-400 hover:border-gray-500'}`}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <circle cx="12" cy="12" r="10" strokeWidth="2" />
                      <circle cx="12" cy="12" r="4" fill="currentColor" />
                    </svg>
                    Single
                  </button>
                  <button
                    type="button"
                    onClick={() => setAttributeForm({ ...attributeForm, inputType: 'MULTI_SELECT' })}
                    className={`p-3 rounded-lg border-2 flex items-center justify-center gap-2 transition-colors ${attributeForm.inputType === 'MULTI_SELECT' ? 'border-green-500 bg-green-500/10 text-green-400' : 'border-gray-600 text-gray-400 hover:border-gray-500'}`}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Multi
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-gray-300 font-medium">Required</span>
                  <p className="text-gray-500 text-sm">Customer must select an option</p>
                </div>
                <button
                  type="button"
                  onClick={() => setAttributeForm({ ...attributeForm, isRequired: !attributeForm.isRequired })}
                  className={`w-12 h-6 rounded-full transition-colors ${attributeForm.isRequired ? 'bg-green-600' : 'bg-gray-600'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${attributeForm.isRequired ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>
            </div>
            <div className="p-6 border-t border-gray-700 flex gap-3">
              <button
                onClick={() => setShowAttributeModal(false)}
                className="flex-1 py-2.5 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAttribute}
                disabled={isSubmitting}
                className="flex-1 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-600 transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting && (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                {editingAttribute ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Attribute Modal */}
      {showSubAttributeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-md">
            <div className="p-6 border-b border-gray-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">
                {editingSubAttribute ? 'Edit Option' : 'New Option'}
              </h2>
              <button onClick={() => setShowSubAttributeModal(false)} className="text-gray-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Name *</label>
                <input
                  type="text"
                  value={subAttributeForm.name}
                  onChange={(e) => setSubAttributeForm({ ...subAttributeForm, name: e.target.value })}
                  placeholder="e.g., Small, Medium, Large"
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Additional Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={subAttributeForm.price}
                  onChange={(e) => setSubAttributeForm({ ...subAttributeForm, price: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-gray-300 font-medium">Available</span>
                  <p className="text-gray-500 text-sm">Option can be selected</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSubAttributeForm({ ...subAttributeForm, isAvailable: !subAttributeForm.isAvailable })}
                  className={`w-12 h-6 rounded-full transition-colors ${subAttributeForm.isAvailable ? 'bg-green-600' : 'bg-gray-600'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${subAttributeForm.isAvailable ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>
            </div>
            <div className="p-6 border-t border-gray-700 flex gap-3">
              <button
                onClick={() => setShowSubAttributeModal(false)}
                className="flex-1 py-2.5 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSubAttribute}
                disabled={isSubmitting}
                className="flex-1 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-600 transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting && (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                {editingSubAttribute ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        type={confirmConfig.type}
      />
    </div>
  );
}
