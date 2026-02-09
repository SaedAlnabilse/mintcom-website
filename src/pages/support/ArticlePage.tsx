import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Clock,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Share2,
  Printer,
  BookOpen,
  ChevronRight,
  MessageSquare,
  CheckCircle2
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';

// All articles data
const allArticles: Record<string, {
  id: string;
  title: string;
  category: string;
  categoryId: string;
  readTime: string;
  views: string;
  lastUpdated: string;
  content: string[];
  relatedArticles: string[];
}> = {
  'gs-1': {
    id: 'gs-1',
    title: 'Creating your Paymint account',
    category: 'Getting Started',
    categoryId: 'getting-started',
    readTime: '5 min',
    views: '8.2k',
    lastUpdated: 'January 15, 2025',
    content: [
      '## Getting Started with Paymint',
      'Welcome to Paymint! This guide will walk you through creating your business account and getting set up for success.',
      '### Step 1: Sign Up',
      'Visit paymint.com and click "Get Started" or "Sign Up". You can create an account using your email address or sign up with Google for faster access.',
      '### Step 2: Verify Your Email',
      'After signing up, you\'ll receive a verification email. Click the link in the email to verify your account. If you don\'t see the email, check your spam folder.',
      '### Step 3: Complete Your Business Profile',
      'Once verified, you\'ll be prompted to enter your business details:',
      '- **Business Name**: Your official business name',
      '- **Business Type**: Restaurant, Retail, Cafe, etc.',
      '- **Currency**: Your primary operating currency',
      '- **Timezone**: For accurate reporting',
      '### Step 4: Create Your First Establishment',
      'An establishment represents a physical location. You can add multiple establishments later if you have multiple locations.',
      '### Step 5: Download the POS App',
      'Download the Paymint POS app from the App Store or Google Play Store on your tablet device.',
      '### What\'s Next?',
      'After completing setup, you\'re ready to add products, invite team members, and start taking orders!'
    ],
    relatedArticles: ['gs-2', 'gs-3', 'gs-4']
  },
  'gs-2': {
    id: 'gs-2',
    title: 'Setting up your first establishment',
    category: 'Getting Started',
    categoryId: 'getting-started',
    readTime: '8 min',
    views: '6.5k',
    lastUpdated: 'January 20, 2025',
    content: [
      '## Setting Up Your Establishment',
      'An establishment in Paymint represents a physical business location. This guide covers all the settings you need to configure.',
      '### Basic Information',
      'Navigate to Settings > Establishment to configure:',
      '- **Name**: The location name (e.g., "Downtown Branch")',
      '- **Address**: Physical address for receipts',
      '- **Phone**: Contact number',
      '- **Email**: Location-specific email',
      '### Business Hours',
      'Set your operating hours for each day of the week. This helps with:',
      '- Shift scheduling',
      '- Report filtering',
      '- Customer expectations',
      '### Tax Configuration',
      'Configure your tax settings:',
      '- **Tax Rate**: Your local sales tax percentage',
      '- **Tax Name**: What appears on receipts (e.g., "VAT", "Sales Tax")',
      '- **Tax Inclusive**: Whether prices include tax',
      '### Receipt Settings',
      'Customize your receipts with:',
      '- Business logo',
      '- Header message',
      '- Footer message',
      '- Social media handles',
      '### Payment Methods',
      'Enable the payment methods you accept:',
      '- Cash',
      '- Credit/Debit Cards',
      '- Mobile Payments',
      '- Custom payment types'
    ],
    relatedArticles: ['gs-1', 'gs-5', 'ft-8']
  },
  'tc-1': {
    id: 'tc-1',
    title: 'Connecting a Bluetooth receipt printer',
    category: 'Technical Support',
    categoryId: 'technical',
    readTime: '8 min',
    views: '5.6k',
    lastUpdated: 'February 1, 2025',
    content: [
      '## Bluetooth Printer Setup Guide',
      'This guide covers connecting thermal receipt printers to your Paymint POS tablet via Bluetooth.',
      '### Supported Printers',
      'Paymint supports most ESC/POS compatible thermal printers, including:',
      '- Munbyn ITPP047, ITPP068',
      '- Epson TM-T20III, TM-T88VI',
      '- Star Micronics TSP143, TSP654',
      '- Generic 80mm/58mm thermal printers',
      '### Before You Begin',
      'Ensure your printer:',
      '- Is fully charged or plugged in',
      '- Has paper loaded correctly',
      '- Is in Bluetooth pairing mode (check manufacturer instructions)',
      '### Step-by-Step Connection',
      '**Step 1: Enable Bluetooth**',
      'On your tablet, go to Settings > Bluetooth and ensure it\'s turned on.',
      '**Step 2: Put Printer in Pairing Mode**',
      'Most printers enter pairing mode by holding the power button for 5 seconds until the LED flashes.',
      '**Step 3: Pair from Tablet Settings**',
      'In your tablet\'s Bluetooth settings, find and tap your printer name to pair.',
      '**Step 4: Connect in Paymint**',
      'Open Paymint > Settings > Printers > Add Printer > Select your paired printer.',
      '**Step 5: Test Print**',
      'Tap "Test Print" to verify the connection.',
      '### Troubleshooting',
      '**Printer not appearing?**',
      '- Turn off both devices, wait 30 seconds, turn printer on first, then tablet',
      '- Ensure printer is not connected to another device',
      '- Check printer is in pairing mode',
      '**Pairing fails?**',
      '- Remove printer from tablet\'s Bluetooth list and try again',
      '- Some printers require a PIN (try 0000 or 1234)',
      '**Connected but not printing?**',
      '- Ensure correct printer model is selected in Paymint',
      '- Check paper is loaded correctly',
      '- Try a test print from printer\'s own menu'
    ],
    relatedArticles: ['tc-5', 'tc-6', 'gs-5']
  },
  'ft-1': {
    id: 'ft-1',
    title: 'Understanding sales reports',
    category: 'Features & How-To',
    categoryId: 'features',
    readTime: '12 min',
    views: '6.2k',
    lastUpdated: 'January 28, 2025',
    content: [
      '## Mastering Paymint Reports',
      'Paymint provides comprehensive reporting to help you understand your business performance.',
      '### Accessing Reports',
      'Navigate to Reports from the main dashboard or sidebar. Reports are available on both the web dashboard and mobile app.',
      '### Sales Summary Report',
      'The main dashboard shows:',
      '- **Total Revenue**: Gross sales for the period',
      '- **Net Sales**: Revenue minus refunds and discounts',
      '- **Orders Count**: Number of transactions',
      '- **Average Order Value**: Net sales divided by orders',
      '### Date Range Selection',
      'Filter reports by:',
      '- Today / Yesterday',
      '- This Week / Last Week',
      '- This Month / Last Month',
      '- Custom date range',
      '### Report Types',
      '**Sales Report**',
      'Detailed breakdown of all sales with payment methods, discounts, and taxes.',
      '**Items Report**',
      'See your best and worst selling items, quantities sold, and revenue per item.',
      '**Staff Report**',
      'Track sales performance by employee, including order counts and totals.',
      '**Payments Report**',
      'Breakdown by payment method (cash, card, etc.) with totals.',
      '**Discounts Report**',
      'Track discount usage, amounts, and frequency.',
      '**Shifts Report**',
      'View cash drawer activity, pay-ins, pay-outs, and discrepancies.',
      '### Exporting Data',
      'All reports can be exported to:',
      '- Excel (.xlsx)',
      '- CSV',
      '- PDF',
      'Click the Export button in the top right of any report.',
      '### Tips for Analysis',
      '- Compare periods to identify trends',
      '- Use the Items report to optimize your menu',
      '- Monitor the Shifts report for cash handling issues',
      '- Track Peak Hours to optimize staffing'
    ],
    relatedArticles: ['ft-10', 'ft-4', 'ft-5']
  },
  'bl-2': {
    id: 'bl-2',
    title: 'Updating your payment method',
    category: 'Billing & Payments',
    categoryId: 'billing',
    readTime: '3 min',
    views: '3.8k',
    lastUpdated: 'February 5, 2025',
    content: [
      '## Managing Your Payment Method',
      'Keep your billing information up to date to ensure uninterrupted service.',
      '### Accessing Billing Settings',
      '1. Log in to the Paymint web dashboard',
      '2. Click on your profile icon in the top right',
      '3. Select "Billing" or navigate to Owner Portal > Billing',
      '### Adding a New Card',
      '1. Click "Add Payment Method"',
      '2. Enter your card details:',
      '   - Card number',
      '   - Expiration date',
      '   - CVV/CVC',
      '   - Billing address',
      '3. Click "Save Card"',
      '### Setting a Default Card',
      'If you have multiple cards on file:',
      '1. Find the card you want as default',
      '2. Click "Set as Default"',
      '3. This card will be used for future charges',
      '### Removing a Card',
      '1. Find the card you want to remove',
      '2. Click the delete icon or "Remove"',
      '3. Confirm the removal',
      '**Note**: You cannot remove your only payment method while on an active subscription.',
      '### Troubleshooting Failed Payments',
      'If your payment fails:',
      '1. Verify card details are correct',
      '2. Ensure sufficient funds are available',
      '3. Check if your bank is blocking the transaction',
      '4. Try a different payment method',
      '5. Contact your bank if issues persist'
    ],
    relatedArticles: ['bl-1', 'bl-3', 'bl-7']
  }
};

// Add more basic article stubs for all the article IDs we reference
const articleStubs = [
  'gs-3', 'gs-4', 'gs-5', 'gs-6', 'gs-7', 'gs-8',
  'bl-1', 'bl-3', 'bl-4', 'bl-5', 'bl-6', 'bl-7', 'bl-8',
  'tc-2', 'tc-3', 'tc-4', 'tc-5', 'tc-6', 'tc-7', 'tc-8', 'tc-9', 'tc-10',
  'ft-2', 'ft-3', 'ft-4', 'ft-5', 'ft-6', 'ft-7', 'ft-8', 'ft-9', 'ft-10'
];

// Generate stub articles for any not fully defined
articleStubs.forEach(id => {
  if (!allArticles[id]) {
    const prefix = id.split('-')[0];
    const categoryMap: Record<string, { name: string; id: string }> = {
      'gs': { name: 'Getting Started', id: 'getting-started' },
      'bl': { name: 'Billing & Payments', id: 'billing' },
      'tc': { name: 'Technical Support', id: 'technical' },
      'ft': { name: 'Features & How-To', id: 'features' }
    };
    const cat = categoryMap[prefix];
    allArticles[id] = {
      id,
      title: `Article ${id}`,
      category: cat.name,
      categoryId: cat.id,
      readTime: '5 min',
      views: '1.0k',
      lastUpdated: 'February 2025',
      content: [
        '## Article Content',
        'This article is coming soon. Please check back later or contact support if you need immediate assistance.',
        '### Need Help Now?',
        'If you need help with this topic, please submit a support ticket and our team will assist you.'
      ],
      relatedArticles: []
    };
  }
});

export const ArticlePage = () => {
  const { articleId } = useParams<{ articleId: string }>();
  const [helpful, setHelpful] = useState<'yes' | 'no' | null>(null);

  const article = articleId ? allArticles[articleId] : null;

  if (!article) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#050505] font-sans text-gray-900 dark:text-white">
        <Navbar />
        <main className="pt-28 pb-20">
          <div className="container mx-auto px-8 md:px-16 lg:px-24 text-center">
            <h1 className="text-3xl font-black mb-4">Article Not Found</h1>
            <p className="text-gray-500 mb-8">The article you're looking for doesn't exist.</p>
            <Link to="/support" className="text-paymint-green font-bold hover:underline">
              ← Back to Help Center
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const relatedArticleData = article.relatedArticles
    .map(id => allArticles[id])
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#050505] font-sans text-gray-900 dark:text-white">
      <Navbar />

      <main className="pt-28 pb-20">
        <div className="container mx-auto px-8 md:px-16 lg:px-24">
          <div className="max-w-4xl mx-auto">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
              <Link to="/support" className="hover:text-paymint-green transition-colors">
                Help Center
              </Link>
              <ChevronRight size={14} />
              <Link to={`/support/category/${article.categoryId}`} className="hover:text-paymint-green transition-colors">
                {article.category}
              </Link>
              <ChevronRight size={14} />
              <span className="text-gray-400 truncate">{article.title}</span>
            </div>

            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <Link
                to={`/support/category/${article.categoryId}`}
                className="inline-flex items-center gap-2 text-sm font-bold text-paymint-green hover:underline mb-4"
              >
                <ArrowLeft size={16} />
                Back to {article.category}
              </Link>

              <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-4">
                {article.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock size={14} />
                  {article.readTime} read
                </span>
                <span className="flex items-center gap-1">
                  <Eye size={14} />
                  {article.views} views
                </span>
                <span>
                  Updated {article.lastUpdated}
                </span>
              </div>
            </motion.div>

            {/* Article Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl p-8 md:p-12 mb-8"
            >
              <div className="prose prose-lg dark:prose-invert max-w-none">
                {article.content.map((paragraph, index) => {
                  if (paragraph.startsWith('## ')) {
                    return (
                      <h2 key={index} className="text-2xl font-black mt-8 mb-4 first:mt-0">
                        {paragraph.replace('## ', '')}
                      </h2>
                    );
                  }
                  if (paragraph.startsWith('### ')) {
                    return (
                      <h3 key={index} className="text-xl font-bold mt-6 mb-3">
                        {paragraph.replace('### ', '')}
                      </h3>
                    );
                  }
                  if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
                    return (
                      <p key={index} className="font-bold my-4">
                        {paragraph.replace(/\*\*/g, '')}
                      </p>
                    );
                  }
                  if (paragraph.startsWith('- ')) {
                    return (
                      <ul key={index} className="list-disc list-inside my-2 ml-4">
                        <li>{paragraph.replace('- ', '')}</li>
                      </ul>
                    );
                  }
                  return (
                    <p key={index} className="my-4 text-gray-700 dark:text-gray-300 leading-relaxed">
                      {paragraph}
                    </p>
                  );
                })}
              </div>
            </motion.div>

            {/* Helpful? */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl p-6 mb-8"
            >
              {helpful === null ? (
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <p className="font-bold">Was this article helpful?</p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setHelpful('yes')}
                      className="inline-flex items-center gap-2 px-6 py-2 bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 rounded-lg font-bold hover:bg-green-200 dark:hover:bg-green-500/30 transition-colors"
                    >
                      <ThumbsUp size={16} />
                      Yes, it helped
                    </button>
                    <button
                      onClick={() => setHelpful('no')}
                      className="inline-flex items-center gap-2 px-6 py-2 bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 rounded-lg font-bold hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
                    >
                      <ThumbsDown size={16} />
                      Not really
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-paymint-green">
                  <CheckCircle2 size={20} />
                  <p className="font-bold">
                    {helpful === 'yes'
                      ? 'Thanks for your feedback!'
                      : 'Sorry this wasn\'t helpful. Consider submitting a ticket for personalized help.'}
                  </p>
                </div>
              )}
            </motion.div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3 mb-12">
              <button className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-white/10 rounded-lg text-sm font-bold hover:bg-gray-200 dark:hover:bg-white/20 transition-colors">
                <Share2 size={16} />
                Share
              </button>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-white/10 rounded-lg text-sm font-bold hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
              >
                <Printer size={16} />
                Print
              </button>
              <Link
                to="/support/tickets/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-white/10 rounded-lg text-sm font-bold hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
              >
                <MessageSquare size={16} />
                Contact Support
              </Link>
            </div>

            {/* Related Articles */}
            {relatedArticleData.length > 0 && (
              <div>
                <h2 className="text-xl font-bold mb-4">Related Articles</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {relatedArticleData.map((related, index) => (
                    <motion.div
                      key={related.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                    >
                      <Link
                        to={`/support/article/${related.id}`}
                        className="block p-4 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl hover:border-paymint-green/30 transition-all group h-full"
                      >
                        <div className="w-10 h-10 bg-paymint-green/10 rounded-lg flex items-center justify-center mb-3">
                          <BookOpen size={18} className="text-paymint-green" />
                        </div>
                        <h4 className="font-bold mb-2 group-hover:text-paymint-green transition-colors line-clamp-2">
                          {related.title}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <Clock size={12} />
                          {related.readTime}
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
