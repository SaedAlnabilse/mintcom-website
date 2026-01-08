import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus,
  CreditCard,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  XCircle,
  Upload,
  Smartphone,
  Globe,
  DollarSign,
  Wallet,
  Star,
  RefreshCw,
  Wand2 // Imported Wand2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../config/api';
import toast from 'react-hot-toast';
import { ConfirmModal } from '../../components/ConfirmModal';

const paymentMethodSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  isActive: z.boolean(),
});

type PaymentMethodFormData = z.infer<typeof paymentMethodSchema>;

interface PaymentMethod {
  id: string;
  name: string;
  imageUrl?: string;
  isActive: boolean;
  isDefault?: boolean;
}

interface CardType {
  id: string;
  name: string;
  imageUrl?: string;
}

export function PaymentMethodsPage() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [cardTypes, setCardTypes] = useState<CardType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newCardName, setNewCardName] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedCardImage, setSelectedCardImage] = useState<File | null>(null);
  const [cardImagePreview, setCardImagePreview] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [cardErrors, setCardErrors] = useState<Record<string, string>>({}); // For manual forms
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

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<PaymentMethodFormData>({ // added watch
    resolver: zodResolver(paymentMethodSchema),
    defaultValues: { isActive: true },
  });

  const paymentMethodName = watch('name'); // watch the name field

  useEffect(() => {
    fetchPaymentMethods();
    fetchCardTypes();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/app-settings/payment-methods');
      setPaymentMethods(response.data || []);
    } catch (err: any) {
      toast.error('Failed to load payment methods');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCardTypes = async () => {
    try {
      const response = await api.get('/card-types');
      setCardTypes(response.data || []);
    } catch (err) {
      console.error('Failed to load card types');
    }
  };

  const uploadImage = async (file: File, endpoint: string) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(endpoint, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleCardImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedCardImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setCardImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // New AI Image Generation Handler
  const handleGenerateImage = async () => {
    if (!paymentMethodName?.trim()) {
      toast.error('Please enter a payment method name first');
      return;
    }

    setIsGeneratingImage(true);
    try {
      const promptText = `minimalist icon logo for payment method ${paymentMethodName}, vector style, flat design, white background, high quality, centered`;

      const response = await api.post('/api/items/generate-image',
        { prompt: promptText },
        { responseType: 'blob' }
      );

      const blob = response.data;
      const file = new File([blob], `${paymentMethodName.toLowerCase().replace(/\s+/g, '-')}-ai.jpg`, { type: 'image/jpeg' });

      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(blob));
      toast.success('AI Icon generated!');
    } catch (error) {
      console.error('Failed to generate image:', error);
      toast.error('Failed to generate icon. Service may be unavailable.');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const onSubmit = async (data: PaymentMethodFormData) => {
    try {
      setIsSubmitting(true);
      let imageUrl = editingMethod?.imageUrl;
      let imageKey = (editingMethod as any)?.imageKey;

      if (selectedImage) {
        const uploadRes = await uploadImage(selectedImage, '/payment-methods/upload-image');
        if (uploadRes.success) {
          imageUrl = uploadRes.imageUrl;
          imageKey = uploadRes.imageKey;
        }
      }

      const payload = {
        name: data.name,
        isActive: data.isActive,
        imageUrl,
        imageKey,
      };

      if (editingMethod) {
        await api.put(`/app-settings/payment-methods/${editingMethod.id}`, payload);
        toast.success('Payment method updated');
      } else {
        await api.post('/app-settings/payment-methods', payload);
        toast.success('Payment method created');
      }

      setShowModal(false);
      fetchPaymentMethods();
    } catch (err: any) {
      toast.error('Failed to save payment method');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (methodId: string, name: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Remove Payment Method',
      message: `Are you sure you want to delete "${name}"? This may affect historical reporting.`,
      type: 'danger',
      onConfirm: async () => {
        try {
          await api.delete(`/app-settings/payment-methods/${methodId}`);
          toast.success('Payment method removed');
          fetchPaymentMethods();
        } catch (err: any) {
          toast.error('Failed to remove method');
        }
      }
    });
  };

  const handleAddCardType = async () => {
    setCardErrors({});
    if (!newCardName.trim()) {
      setCardErrors({ cardName: 'Required' });
      return;
    }
    try {
      setIsSubmitting(true);
      let imageUrl, imageKey;
      if (selectedCardImage) {
        const uploadRes = await uploadImage(selectedCardImage, '/card-types/upload-image');
        if (uploadRes.success) {
          imageUrl = uploadRes.imageUrl;
          imageKey = uploadRes.imageKey;
        }
      }
      await api.post('/card-types', { name: newCardName, imageUrl, imageKey });
      toast.success('Card type added');
      setShowCardModal(false);
      fetchCardTypes();
    } catch (err: any) {
      toast.error('Failed to add card type');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCardType = async (cardId: string, name: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Card Type',
      message: `Remove "${name}" from accepted card types?`,
      type: 'danger',
      onConfirm: async () => {
        try {
          await api.delete(`/card-types/${cardId}`);
          toast.success('Card type removed');
          fetchCardTypes();
        } catch (err: any) {
          toast.error('Failed to delete');
        }
      }
    });
  };

  const getMethodIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('cash')) return <DollarSign size={24} />;
    if (lower.includes('card') || lower.includes('visa') || lower.includes('master')) return <CreditCard size={24} />;
    if (lower.includes('mobile') || lower.includes('phone') || lower.includes('wallet')) return <Smartphone size={24} />;
    if (lower.includes('online')) return <Globe size={24} />;
    return <Wallet size={24} />;
  };

  return (
    <div className="space-y-10 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Payment Infrastructure</h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium mt-1">Configure your checkout experience and accepted settlement methods.</p>
        </div>
        <button
          onClick={() => { setEditingMethod(null); reset({ name: '', isActive: true }); setImagePreview(null); setShowModal(true); setIsGeneratingImage(false); }}
          className="px-6 py-3 bg-paymint-green text-black font-black rounded-2xl hover:scale-105 transition-all flex items-center gap-2 shadow-lg shadow-paymint-green/20 active:scale-95"
        >
          <Plus size={20} />
          <span>Add Custom Method</span>
        </button>
      </div>

      {/* Main Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            Accepted Methods
            <span className="px-2 py-0.5 rounded-full bg-paymint-green/10 text-paymint-green text-[10px] font-black uppercase tracking-widest">Active</span>
          </h2>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-48 rounded-[2rem] bg-gray-100 dark:bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {paymentMethods.map((method) => (
              <motion.div
                layout
                key={method.id}
                className={`group relative bg-white dark:bg-[#0A0A0A] p-8 rounded-[2.5rem] border-2 transition-all duration-300 ${method.isActive
                  ? 'border-paymint-green/20 hover:border-paymint-green/50 shadow-sm hover:shadow-xl'
                  : 'border-gray-100 dark:border-white/5 opacity-60'
                  }`}
              >
                <div className="flex justify-between items-start mb-8">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border-2 border-gray-100 dark:border-white/5 shadow-inner transition-transform group-hover:scale-110 duration-500 overflow-hidden ${method.isActive ? 'bg-paymint-green/10 text-paymint-green' : 'bg-gray-50 dark:bg-white/5 text-gray-400'
                    }`}>
                    {method.imageUrl ? (
                      <img src={method.imageUrl} alt={method.name} className="w-full h-full object-cover" />
                    ) : (
                      getMethodIcon(method.name)
                    )}
                  </div>

                  {!method.isDefault && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => { setEditingMethod(method); reset({ name: method.name, isActive: method.isActive }); setImagePreview(method.imageUrl || null); setShowModal(true); setIsGeneratingImage(false); }} className="p-2 rounded-xl bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-paymint-green">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(method.id, method.name)} className="p-2 rounded-xl bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-paymint-red">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>

                <h3 className="text-xl font-black text-gray-900 dark:text-white truncate">{method.name}</h3>
                <div className="mt-4 flex items-center justify-between">
                  <div className={`flex items-center gap-1.5 font-black text-[10px] uppercase tracking-[0.15em] ${method.isActive ? 'text-paymint-green' : 'text-gray-400'}`}>
                    {method.isActive ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                    {method.isActive ? 'Available' : 'Disabled'}
                  </div>
                  {method.isDefault && (
                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-1">
                      <Star size={10} fill="currentColor" /> System
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Card Types Section */}
      <section className="bg-white dark:bg-[#0A0A0A] rounded-[3rem] border border-gray-100 dark:border-white/5 p-10 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
          <CreditCard size={200} />
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 relative z-10">
          <div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Accepted Card Networks</h2>
            <p className="text-gray-500 font-medium mt-1">Specify which card providers are visually supported at your terminals.</p>
          </div>
          <button
            onClick={() => { setNewCardName(''); setCardImagePreview(null); setShowCardModal(true); setCardErrors({}); }}
            className="px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-black font-black rounded-[1.25rem] text-sm flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-xl"
          >
            <Plus size={18} />
            Add Network
          </button>
        </div>

        <div className="flex flex-wrap gap-4 relative z-10">
          {cardTypes.length === 0 ? (
            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs py-8">No card networks configured yet.</p>
          ) : (
            cardTypes.map((card) => (
              <div key={card.id} className="group flex items-center gap-4 pl-4 pr-3 py-3 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 transition-all hover:border-paymint-green/30">
                <div className="w-10 h-10 bg-white dark:bg-black rounded-xl flex items-center justify-center border border-gray-100 dark:border-white/10 shadow-sm overflow-hidden p-1">
                  {card.imageUrl ? (
                    <img src={card.imageUrl} alt={card.name} className="w-full h-full object-contain" />
                  ) : (
                    <CreditCard size={18} className="text-gray-400" />
                  )}
                </div>
                <span className="text-sm font-black text-gray-900 dark:text-white">{card.name}</span>
                <button
                  onClick={() => handleDeleteCardType(card.id, card.name)}
                  className="p-2 text-gray-400 hover:text-paymint-red opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Payment Method Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-[#0A0A0A] rounded-[2.5rem] border border-gray-100 dark:border-white/5 w-full max-w-md shadow-2xl overflow-hidden">
              <div className="p-8 border-b border-gray-50 dark:border-white/5 flex items-center justify-between">
                <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                  {editingMethod ? 'Configure Method' : 'Add Settlement'}
                </h2>
                <button
                  onClick={() => !isGeneratingImage && setShowModal(false)}
                  disabled={isGeneratingImage}
                  className="p-2 text-gray-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-8">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-24 h-24 bg-gray-50 dark:bg-white/5 rounded-[2rem] flex items-center justify-center border-2 border-dashed border-gray-200 dark:border-white/10 overflow-hidden relative group cursor-pointer">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Upload size={32} className="text-gray-300" />
                    )}
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={handleImageChange} />
                  </div>

                  {/* AI Generation Button for Payment Methods */}
                  <button
                    type="button"
                    onClick={handleGenerateImage}
                    disabled={isGeneratingImage || !paymentMethodName?.trim()}
                    className="flex items-center gap-2 text-xs font-bold text-paymint-green bg-paymint-green/10 px-4 py-2 rounded-xl hover:bg-paymint-green/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGeneratingImage ? (
                      <div className="w-4 h-4 border-2 border-paymint-green/30 border-t-paymint-green rounded-full animate-spin" />
                    ) : (
                      <Wand2 size={14} />
                    )}
                    <span>Generate Icon</span>
                  </button>

                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Branded Icon (Optional)</p>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 px-1">
                    Legal Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('name')}
                    className={`w-full px-5 py-4 bg-gray-50 dark:bg-white/5 border ${errors.name ? 'border-red-500 ring-2 ring-red-500/20' : 'border-none'} rounded-2xl text-gray-900 dark:text-white font-black focus:outline-none focus:ring-2 focus:ring-paymint-green/20 transition-all`}
                    placeholder="e.g. DIGITAL WALLET"
                  />
                  {errors.name && <p className="text-red-500 text-[10px] font-black uppercase mt-2 px-1">{errors.name.message}</p>}
                </div>

                <div className="flex items-center justify-between p-5 bg-gray-50 dark:bg-white/5 rounded-[1.5rem] border border-gray-100 dark:border-white/5">
                  <div>
                    <p className="text-sm font-black text-gray-900 dark:text-white">Active Status</p>
                    <p className="text-[10px] text-gray-500 font-bold uppercase mt-0.5">Enable during checkout</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" {...register('isActive')} className="sr-only peer" />
                    <div className="w-12 h-6 bg-gray-200 dark:bg-gray-800 rounded-full peer peer-checked:bg-paymint-green transition-all after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-6"></div>
                  </label>
                </div>

                <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-paymint-green text-black font-black rounded-2xl hover:scale-[1.02] shadow-xl shadow-paymint-green/20 uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2">
                  {isSubmitting && <RefreshCw size={16} className="animate-spin" />}
                  {editingMethod ? 'Update Protocol' : 'Initialize Method'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Card Type Modal */}
      <AnimatePresence>
        {showCardModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-[#0A0A0A] rounded-[2.5rem] border border-gray-100 dark:border-white/5 w-full max-w-sm shadow-2xl overflow-hidden">
              <div className="p-8 border-b border-gray-50 dark:border-white/5 flex items-center justify-between">
                <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Add Network</h2>
                <button onClick={() => setShowCardModal(false)} className="p-2 text-gray-400 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>
              <div className="p-8 space-y-8">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-24 h-24 bg-gray-50 dark:bg-white/5 rounded-[2rem] flex items-center justify-center border-2 border-dashed border-gray-200 dark:border-white/10 overflow-hidden relative cursor-pointer">
                    {cardImagePreview ? (
                      <img src={cardImagePreview} alt="Preview" className="w-full h-full object-contain p-4" />
                    ) : (
                      <Upload size={32} className="text-gray-300" />
                    )}
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={handleCardImageChange} />
                  </div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Provider Logo</p>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 px-1">
                    Network Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newCardName}
                    onChange={(e) => {
                      setNewCardName(e.target.value);
                      if (cardErrors.cardName) setCardErrors({ ...cardErrors, cardName: '' });
                    }}
                    className={`w-full px-5 py-4 bg-gray-50 dark:bg-white/5 border ${cardErrors.cardName ? 'border-red-500 ring-2 ring-red-500/20' : 'border-none'} rounded-2xl text-gray-900 dark:text-white font-black focus:outline-none focus:ring-2 focus:ring-paymint-green/20 transition-all`}
                    placeholder="e.g. MASTERCARD"
                  />
                  {cardErrors.cardName && <p className="text-red-500 text-[10px] font-black uppercase mt-2 px-1">{cardErrors.cardName}</p>}
                </div>

                <button
                  onClick={handleAddCardType}
                  disabled={isSubmitting || !newCardName.trim()}
                  className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-black font-black rounded-2xl hover:scale-[1.02] shadow-xl transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2"
                >
                  {isSubmitting && <RefreshCw size={16} className="animate-spin" />}
                  Register Network
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