export interface FAQItem {
  question: string;
  answer: string;
  category: 'general' | 'billing' | 'technical' | 'account' | 'products' | 'orders' | 'staff';
}

export const FAQ_DATA: FAQItem[] = [
  // Getting Started
  {
    category: 'general',
    question: 'How do I get started with Paymint?',
    answer: 'Sign up for an account, verify your email, complete the onboarding wizard to set up your first establishment, then start adding products and you\'re ready to sell!'
  },

  // Products
  {
    category: 'products',
    question: 'How do I add a new product?',
    answer: 'Go to Dashboard > Products and click "Add Product". Fill in the name, price, category, and optionally add an image. Enable "Track Stock" for inventory management.'
  },
  {
    category: 'products',
    question: 'Can I track inventory?',
    answer: 'Yes! When editing a product, enable "Track Stock" and set your initial quantity. You can also set low-stock thresholds to get alerts when running low.'
  },
  {
    category: 'products',
    question: 'How do I set up product add-ons?',
    answer: 'Go to Dashboard > Add-ons to create modifier groups (like sizes, toppings, extras). Then link these groups to your products for customizable ordering.'
  },
  {
    category: 'products',
    question: 'How do I organize products into categories?',
    answer: 'Go to Dashboard > Categories to create categories. When adding or editing products, you can assign them to these categories for better organization.'
  },

  // Orders
  {
    category: 'orders',
    question: 'Where can I view my orders?',
    answer: 'Go to Dashboard > Orders to see all your transactions. You can filter by date, status, payment method, and search for specific orders.'
  },
  {
    category: 'orders',
    question: 'How do I process a refund?',
    answer: 'Find the order in Dashboard > Orders, click on it to view details, then click "Refund" or "Void". You can do full or partial refunds.'
  },

  // Staff
  {
    category: 'staff',
    question: 'How do I add employees?',
    answer: 'Go to Dashboard > Staff and click "Add Employee". Enter their details, assign a role, and set up their PIN for POS access. They\'ll receive an email to set up their account.'
  },
  {
    category: 'staff',
    question: 'How do roles and permissions work?',
    answer: 'Go to Dashboard > Roles to create custom roles with specific permissions. You can control access to features like viewing orders, editing products, managing discounts, and more.'
  },

  // Billing
  {
    category: 'billing',
    question: 'How do I change my subscription?',
    answer: 'Navigate to Owner Portal > Billing to view your current plan, upgrade, or manage your subscription. You can also download invoices and update payment methods.'
  },
  {
    category: 'billing',
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards and debit cards for subscription payments. Your billing is processed securely through our payment provider.'
  },

  // Technical
  {
    category: 'technical',
    question: 'The POS is offline, what do I do?',
    answer: 'Paymint works offline for basic cash sales. Your data will sync automatically when you reconnect. Check your internet connection if issues persist.'
  },
  {
    category: 'technical',
    question: 'What hardware does Paymint support?',
    answer: 'Paymint works with popular receipt printers (Epson, Star), barcode scanners, cash drawers, and payment terminals. Check our hardware page for specific models.'
  },
  {
    category: 'technical',
    question: 'How do I view activity logs?',
    answer: 'Go to Dashboard > Activity Logs to see all actions taken in your establishment. You can filter by user, action type, and date range.'
  },

  // Account
  {
    category: 'account',
    question: 'How do I reset my password?',
    answer: 'Click "Forgot Password" on the login screen, enter your email, and check your inbox for a reset link. The link expires in 24 hours.'
  },
  {
    category: 'account',
    question: 'How do I update my profile?',
    answer: 'Go to Owner Portal > Account to update your profile information, change your password, manage notification preferences, and security settings.'
  },
  {
    category: 'account',
    question: 'How do I manage multiple locations?',
    answer: 'Go to Owner Portal > Establishments to view and manage all your locations. You can add new establishments, edit details, or group them under brands.'
  }
];
