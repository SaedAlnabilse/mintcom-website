export interface FAQItem {
  question: string;
  answer: string;
  category: 'general' | 'billing' | 'technical' | 'account';
}

export const FAQ_DATA: FAQItem[] = [
  {
    category: 'general',
    question: 'How do I add a new product?',
    answer: 'Go to Dashboard > Products and click the "Add Product" button. Fill in the details like name, price, and category, then save.'
  },
  {
    category: 'general',
    question: 'Can I track inventory?',
    answer: 'Yes! When editing a product, enable "Track Stock" and set your initial quantity and low-stock thresholds.'
  },
  {
    category: 'billing',
    question: 'How do I change my subscription?',
    answer: 'Navigate to Settings > Billing to view and upgrade your current plan.'
  },
  {
    category: 'technical',
    question: 'The POS is offline, what do I do?',
    answer: 'Check your internet connection. Paymint works offline for basic sales, but you need to reconnect to sync data to the cloud.'
  },
  {
    category: 'account',
    question: 'How do I reset my password?',
    answer: 'Click "Forgot Password" on the login screen or go to Profile Settings if you are already logged in.'
  }
];
