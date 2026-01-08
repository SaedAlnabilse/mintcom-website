import { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Search,
  Package,
  CheckCircle2,
  Grid,
  Edit2,
  Trash2,
  ChevronDown,
  X,
  ChevronLeft,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [page, setPage] = useState(1);
  const itemsPerPage = 8;

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
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchAttributes();
  }, []);

  const fetchAttributes = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/api/attributes');
      setAttributes(response.data || []);
    } catch (err: any) {
      toast.error('Failed to load attributes');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAttributes = useMemo(() => {
    return attributes.filter((attr) =>
      attr.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [attributes, searchQuery]);

  const totalPages = Math.ceil(filteredAttributes.length / itemsPerPage);
  const paginatedAttributes = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filteredAttributes.slice(start, start + itemsPerPage);
  }, [filteredAttributes, page]);

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
    setErrors({});
  };

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
    setErrors({});
  };

  const handleSaveAttribute = async () => {
    setErrors({});
    if (!attributeForm.name.trim()) {
      setErrors({ groupName: 'Required' });
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
      toast.error('Error saving attribute');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAttribute = async (id: string) => {
    const attr = attributes.find((a) => a.id === id);
    if (attr && attr.subAttributes?.length > 0) {
      toast.error('Clear all options first');
      return;
    }
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Attribute',
      message: 'Remove this customization group permanently?',
      type: 'danger',
      onConfirm: async () => {
        try {
          await api.delete(`/api/attributes/${id}`);
          toast.success('Attribute removed');
          fetchAttributes();
        } catch (err: any) {
          toast.error('Failed to delete');
        }
      }
    });
  };

  const handleSaveSubAttribute = async () => {
    setErrors({});
    if (!subAttributeForm.name.trim()) {
      setErrors({ optionName: 'Required' });
      return;
    }
    if (!parentAttributeId) return;
    setIsSubmitting(true);
    try {
      if (editingSubAttribute) {
        await api.put(`/api/attributes/sub-attributes/${editingSubAttribute.id}`, subAttributeForm);
        toast.success('Option saved');
      } else {
        await api.post(`/api/attributes/${parentAttributeId}/sub-attributes`, subAttributeForm);
        toast.success('Option added');
      }
      setShowSubAttributeModal(false);
      fetchAttributes();
    } catch (err: any) {
      toast.error('Failed to save option');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSubAttribute = async (subAttrId: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Option',
      message: 'Remove this specific modifier option?',
      type: 'danger',
      onConfirm: async () => {
        try {
          await api.delete(`/api/attributes/sub-attributes/${subAttrId}`);
          toast.success('Option removed');
          fetchAttributes();
        } catch (err: any) {
          toast.error('Failed to delete');
        }
      }
    });
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Add-ons & Modifiers</h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium mt-1">Global item customizations, groups, and incremental pricing.</p>
        </div>
        <button
          onClick={() => openAttributeModal()}
          className="px-6 py-3 bg-paymint-green text-black font-black rounded-2xl hover:scale-105 transition-all flex items-center gap-2 shadow-lg shadow-paymint-green/20"
        >
          <Plus size={20} />
          <span>New Group</span>
        </button>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-paymint-green transition-colors" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            placeholder="Filter add-on groups..."
            className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-[#0A0A0A] border border-gray-200 dark:border-white/5 rounded-[1.25rem] text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-paymint-green/20 focus:border-paymint-green/30 shadow-md transition-all"
          />
        </div>
      </div>

      {/* Attributes List */}
      {isLoading ? (
        <div className="py-32 flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-paymint-green/10 border-t-paymint-green rounded-full animate-spin mb-4" />
        </div>
      ) : paginatedAttributes.length === 0 ? (
        <div className="py-24 bg-white dark:bg-[#0A0A0A] rounded-[2.5rem] border border-gray-200 dark:border-white/5 text-center flex flex-col items-center shadow-md">
          <div className="w-24 h-24 bg-gray-100 dark:bg-white/5 rounded-[2.5rem] flex items-center justify-center mb-6 border border-gray-200 dark:border-transparent">
            <Package size={32} className="text-gray-300" />
          </div>
          <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">No customization groups</h3>
          <p className="text-gray-500 max-w-xs font-medium">Create modifiers to allow staff to customize item orders during checkout.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {paginatedAttributes.map((attr) => (
            <motion.div
              layout
              key={attr.id}
              className="bg-white dark:bg-[#0A0A0A] rounded-[2rem] border border-gray-200 dark:border-white/5 overflow-hidden shadow-md hover:shadow-lg hover:border-gray-300 dark:hover:border-white/10 transition-all"
            >
              <div
                className="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors group"
                onClick={() => setExpandedId(expandedId === attr.id ? null : attr.id)}
              >
                <div className="flex items-center gap-5">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black border ${attr.isRequired ? 'bg-paymint-green text-black border-paymint-green' : 'bg-gray-200 dark:bg-white/5 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-transparent'
                    }`}>
                    {attr.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-black text-gray-900 dark:text-white text-lg">{attr.name}</h3>
                      {attr.isRequired && (
                        <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-paymint-green/10 text-paymint-green rounded-md border border-paymint-green/20">Mandatory</span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                      {attr.inputType === 'SINGLE_SELECT' ? 'Single Selection' : 'Multiple Selection'} • {attr.subAttributes?.length || 0} Options
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={(e) => { e.stopPropagation(); openAttributeModal(attr); }} className="p-2 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-transparent text-gray-600 dark:text-gray-400 hover:text-paymint-green hover:border-paymint-green/30">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteAttribute(attr.id); }} className="p-2 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-transparent text-gray-600 dark:text-gray-400 hover:text-paymint-red hover:border-paymint-red/30">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-gray-300 transition-transform duration-500 ${expandedId === attr.id ? 'rotate-180' : ''}`} />
                </div>
              </div>

              <AnimatePresence>
                {expandedId === attr.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-gray-100 dark:border-white/5 bg-gray-100/50 dark:bg-black/20 p-8"
                  >
                    <div className="flex items-center justify-between mb-8">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Add-on Options</span>
                      <button
                        onClick={() => openSubAttributeModal(attr.id)}
                        className="px-4 py-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-paymint-green hover:text-black hover:border-paymint-green transition-all flex items-center gap-2"
                      >
                        <Plus size={14} /> Add Option
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {attr.subAttributes?.map((sub) => (
                        <div key={sub.id} className="flex items-center justify-between p-4 bg-white dark:bg-[#0A0A0A] rounded-2xl border border-gray-200 dark:border-white/5 group/sub hover:border-gray-300 dark:hover:border-white/10 transition-all">
                          <div>
                            <p className="font-black text-gray-900 dark:text-white text-sm">{sub.name}</p>
                            <p className="text-[10px] font-black text-paymint-green mt-1">
                              {sub.price > 0 ? `+${sub.price.toFixed(2)} JOD` : 'COMPLIMENTARY'}
                            </p>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover/sub:opacity-100 transition-opacity">
                            <button onClick={() => openSubAttributeModal(attr.id, sub)} className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-paymint-green hover:bg-paymint-green/10">
                              <Edit2 size={14} />
                            </button>
                            <button onClick={() => handleDeleteSubAttribute(sub.id)} className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-paymint-red hover:bg-paymint-red/10">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-8">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-3 rounded-xl bg-white dark:bg-[#0A0A0A] border border-gray-200 dark:border-white/5 text-gray-600 dark:text-gray-500 hover:text-paymint-green hover:border-paymint-green/30 disabled:opacity-30 transition-all">
                <ChevronLeft size={20} />
              </button>
              <div className="flex items-center gap-1">
                {[...Array(totalPages)].map((_, i) => (
                  <button key={i} onClick={() => setPage(i + 1)} className={`w-10 h-10 rounded-xl text-xs font-black transition-all ${page === i + 1 ? 'bg-paymint-green text-black shadow-lg' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}>
                    {i + 1}
                  </button>
                ))}
              </div>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-3 rounded-xl bg-white dark:bg-[#0A0A0A] border border-gray-200 dark:border-white/5 text-gray-600 dark:text-gray-500 hover:text-paymint-green hover:border-paymint-green/30 disabled:opacity-30 transition-all">
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Attribute Group Modal */}
      <AnimatePresence>
        {showAttributeModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-[#0A0A0A] rounded-[2.5rem] border border-gray-100 dark:border-white/5 w-full max-w-md shadow-2xl overflow-hidden">
              <div className="p-8 border-b border-gray-50 dark:border-white/5 flex items-center justify-between">
                <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Add-on Group</h2>
                <button onClick={() => setShowAttributeModal(false)} className="p-2 text-gray-400 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>
              <div className="p-8 space-y-8">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 px-1">
                    Group Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={attributeForm.name}
                    onChange={(e) => {
                      setAttributeForm({ ...attributeForm, name: e.target.value });
                      if (errors.groupName) setErrors({ ...errors, groupName: '' });
                    }}
                    className={`w-full px-5 py-4 bg-gray-50 dark:bg-white/5 border ${errors.groupName ? 'border-red-500 ring-2 ring-red-500/20' : 'border-none'} rounded-2xl text-gray-900 dark:text-white font-black focus:outline-none focus:ring-2 focus:ring-paymint-green/20 transition-all`}
                    placeholder="e.g. COOKING PREFERENCE"
                  />
                  {errors.groupName && <p className="mt-1 text-xs font-bold text-red-500">{errors.groupName}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setAttributeForm({ ...attributeForm, inputType: 'SINGLE_SELECT' })}
                    className={`p-5 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 ${attributeForm.inputType === 'SINGLE_SELECT' ? 'border-paymint-green bg-paymint-green/5 text-paymint-green' : 'border-gray-50 dark:border-white/5 text-gray-400'}`}
                  >
                    <CheckCircle2 size={24} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-center">Single Selection</span>
                  </button>
                  <button
                    onClick={() => setAttributeForm({ ...attributeForm, inputType: 'MULTI_SELECT' })}
                    className={`p-5 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 ${attributeForm.inputType === 'MULTI_SELECT' ? 'border-paymint-green bg-paymint-green/5 text-paymint-green' : 'border-gray-50 dark:border-white/5 text-gray-400'}`}
                  >
                    <Grid size={24} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-center">Multiple Selection</span>
                  </button>
                </div>

                <div className="flex items-center justify-between p-5 bg-gray-50 dark:bg-white/5 rounded-[1.5rem] border border-gray-100 dark:border-white/5">
                  <div>
                    <p className="text-sm font-black text-gray-900 dark:text-white">Required</p>
                    <p className="text-[10px] text-gray-500 font-bold uppercase mt-0.5">Customer must select an option</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={attributeForm.isRequired} onChange={() => setAttributeForm({ ...attributeForm, isRequired: !attributeForm.isRequired })} className="sr-only peer" />
                    <div className="w-12 h-6 bg-gray-200 dark:bg-gray-800 rounded-full peer peer-checked:bg-paymint-green transition-all after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-6"></div>
                  </label>
                </div>

                <button onClick={handleSaveAttribute} disabled={isSubmitting} className="w-full py-4 bg-paymint-green text-black font-black rounded-2xl hover:scale-[1.02] shadow-xl uppercase tracking-widest text-xs flex items-center justify-center gap-2">
                  {isSubmitting && <RefreshCw size={16} className="animate-spin" />}
                  Save Configuration
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modifier Option Modal */}
      <AnimatePresence>
        {showSubAttributeModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-[#0A0A0A] rounded-[2.5rem] border border-gray-100 dark:border-white/5 w-full max-w-sm shadow-2xl overflow-hidden">
              <div className="p-8 border-b border-gray-50 dark:border-white/5 flex items-center justify-between">
                <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Add-on Option</h2>
                <button onClick={() => setShowSubAttributeModal(false)} className="p-2 text-gray-400 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>
              <div className="p-8 space-y-8">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 px-1">
                    Option Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={subAttributeForm.name}
                    onChange={(e) => {
                      setSubAttributeForm({ ...subAttributeForm, name: e.target.value });
                      if (errors.optionName) setErrors({ ...errors, optionName: '' });
                    }}
                    className={`w-full px-5 py-4 bg-gray-50 dark:bg-white/5 border ${errors.optionName ? 'border-red-500 ring-2 ring-red-500/20' : 'border-none'} rounded-2xl text-gray-900 dark:text-white font-black focus:outline-none focus:ring-2 focus:ring-paymint-green/20 transition-all`}
                    placeholder="e.g. DOUBLE ESPRESSO"
                  />
                  {errors.optionName && <p className="mt-1 text-xs font-bold text-red-500">{errors.optionName}</p>}
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 px-1">Price (JOD)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={subAttributeForm.price}
                    onChange={(e) => setSubAttributeForm({ ...subAttributeForm, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-5 py-4 bg-gray-50 dark:bg-white/5 border-none rounded-2xl text-gray-900 dark:text-white font-black focus:ring-2 focus:ring-paymint-green/20 transition-all"
                  />
                </div>

                <div className="flex items-center justify-between p-5 bg-gray-50 dark:bg-white/5 rounded-[1.5rem] border border-gray-100 dark:border-white/5">
                  <p className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tighter">Available</p>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={subAttributeForm.isAvailable} onChange={() => setSubAttributeForm({ ...subAttributeForm, isAvailable: !subAttributeForm.isAvailable })} className="sr-only peer" />
                    <div className="w-12 h-6 bg-gray-200 dark:bg-gray-800 rounded-full peer peer-checked:bg-paymint-green transition-all after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-6"></div>
                  </label>
                </div>

                <button onClick={handleSaveSubAttribute} disabled={isSubmitting} className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-black font-black rounded-2xl hover:scale-[1.02] shadow-xl uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2">
                  {isSubmitting && <RefreshCw size={16} className="animate-spin" />}
                  Save Option
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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