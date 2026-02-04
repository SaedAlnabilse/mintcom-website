import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import api from '../config/api';
import { useAuth } from './AuthContext';

// Supported currencies with their symbols
export const CURRENCIES = [
  { code: 'JOD', name: 'Jordanian Dinar', symbol: 'JOD' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: 'SAR' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'AED' },
  { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'KWD' },
  { code: 'BHD', name: 'Bahraini Dinar', symbol: 'BHD' },
  { code: 'OMR', name: 'Omani Rial', symbol: 'OMR' },
  { code: 'QAR', name: 'Qatari Riyal', symbol: 'QAR' },
  { code: 'EGP', name: 'Egyptian Pound', symbol: 'EGP' },
  { code: 'IQD', name: 'Iraqi Dinar', symbol: 'IQD' },
];

interface CurrencyContextType {
  currency: string;
  currencySymbol: string;
  refreshCurrency: () => Promise<void>;
  formatAmount: (amount: number | string | null | undefined) => string;
  loading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

interface CurrencyProviderProps {
  children: ReactNode;
}

export const CurrencyProvider: React.FC<CurrencyProviderProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [currency, setCurrency] = useState<string>('JOD');
  const [loading, setLoading] = useState(true);

  // Get the current currency symbol
  const currencySymbol = CURRENCIES.find(c => c.code === currency)?.symbol || currency;

  // Refresh currency from backend
  const refreshCurrency = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      const response = await api.get('/app-settings');
      const data = response.data;
      if (data.currency) {
        setCurrency(data.currency.toUpperCase());
      }
    } catch (error) {
      console.error('Failed to refresh currency:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Load currency on mount and poll periodically
  useEffect(() => {
    if (isAuthenticated) {
      refreshCurrency();

      // Poll for currency updates every 30 seconds (to sync with POS)
      const intervalId = setInterval(() => {
        refreshCurrency();
      }, 30000);

      return () => clearInterval(intervalId);
    }
  }, [refreshCurrency, isAuthenticated]);

  // Format amount with currency (symbol after amount for consistency)
  const formatAmount = (amount: number | string | null | undefined): string => {
    if (amount === null || amount === undefined) {
      return `0.00 ${currencySymbol}`;
    }
    const numAmount = typeof amount === 'number' ? amount : parseFloat(amount);
    if (isNaN(numAmount)) {
      return `0.00 ${currencySymbol}`;
    }
    return `${numAmount.toFixed(2)} ${currencySymbol}`;
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        currencySymbol,
        refreshCurrency,
        formatAmount,
        loading,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = (): CurrencyContextType => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

export default CurrencyContext;
