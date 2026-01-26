import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Plus,
  Grid,
  List,
  Package,
  Edit2,
  Trash2,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  Download
} from 'lucide-react';
import api from '../../config/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { ConfirmModal } from '../../components/ConfirmModal';
import { ProductFormModal } from '../../components/forms/ProductFormModal';
import { exportToCSV } from '../../utils/export';
import { CustomSelect } from '../../components/CustomSelect';

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  costPrice?: number;
  categoryId?: string;
  category?: { id: string; name: string };
  image?: string;
  isAvailable: boolean;
  availableStock?: number;
  trackStock?: boolean;
  allowNegativeStock?: boolean;
  lowStockThresholdYellow?: number;
  lowStockThresholdRed?: number;
  barcode?: string;
  type?: 'ITEM' | 'ADDON';
}

interface Category {
  id: string;
  name: string;
}

export function ProductsPage() {
  const { account } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  // ... (rest of state)

  // Check permissions
  const canViewCosts = useMemo(() => {
    if (!account) return false;
    if (!account.isSecondaryAdmin) return true; // Owner sees all
    return account.permissions?.includes('view_costs') ?? false;
  }, [account]);

  // ... (existing effects)

  const handleExport = () => {
    const exportData = filteredProducts.map(p => {
      const data: any = {
        name: p.name,
        category: p.category?.name || 'Uncategorized',
        price: p.price,
        stock: p.trackStock ? p.availableStock : 'N/A',
        status: p.isAvailable ? 'Active' : 'Inactive',
        barcode: p.barcode || 'N/A'
      };
      
      if (canViewCosts) {
        data.cost = p.costPrice || 0;
      }
      
      return data;
    });

    const headers: any = {
      name: 'Product Name',
      category: 'Category',
      price: 'Price (JOD)',
      stock: 'Stock Level',
      status: 'Status',
      barcode: 'Barcode'
    };

    if (canViewCosts) {
      headers.cost = 'Cost Price (JOD)';
    }

    exportToCSV(exportData, 'products_catalog', headers);
  };

  // ... (rest of logic)

  // In return JSX, update ProductFormModal
  return (
    // ...
      <ProductFormModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        onSubmit={onSubmit} 
        onDelete={editingProduct ? () => handleDelete(editingProduct.id) : undefined} 
        initialData={editingProduct} 
        categories={categories} 
        isSubmitting={isSubmitting}
        canViewCosts={canViewCosts} // Pass prop
      />
    // ...
  );
}
