import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  QrCode,
  Smartphone,
  ExternalLink,
  Copy,
  Check,
  Printer,
  UtensilsCrossed,
  Sun,
  Moon,
  Wifi,
  KeyRound,
  Sliders,
  Sparkles,
  CheckCircle2,
  ChefHat,
  ShoppingCart,
  Bell,
  Receipt,
  FileText,
  Clock,
  Trash2,
  Layers,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { CustomerDigitalMenu } from '../components/qr-menu/CustomerDigitalMenu';
import { TableStandModal } from '../components/qr-menu/TableStandModal';
import { useTheme } from '../context/ThemeContext';
import { type TableOrder } from '../components/qr-menu/menuData';

const PRESET_TABLES = [
  'Table 1 (Window)',
  'Table 4 (Patio)',
  'Table 7 (Indoor)',
  'Table 12 (VIP Lounge)',
  'Terrace 3',
];

interface KitchenTicket {
  id: string;
  orderNumber: string;
  table: string;
  items: { name: string; quantity: number; note?: string; price: number }[];
  total: number;
  time: string;
  type: 'order' | 'waiter' | 'bill';
  status: 'received' | 'preparing' | 'ready';
}

const INITIAL_TICKETS: KitchenTicket[] = [
  {
    id: 'k-101',
    orderNumber: '#102',
    table: 'Table 4 (Patio)',
    items: [
      { name: 'Wagyu Truffle Burger', quantity: 2, note: 'Medium-rare, extra cheddar', price: 17.0 },
      { name: 'Artisan Berry Mojito', quantity: 2, note: 'Less ice', price: 7.0 },
    ],
    total: 24.0,
    time: '8:45 PM',
    type: 'order',
    status: 'preparing',
  },
];

export const QrMenuDemoPage: React.FC = () => {
  const { setTheme, resolvedTheme } = useTheme();

  // Version 1 (View-Only) vs Version 2 (Interactive Table Ordering)
  const [version, setVersion] = useState<'v1' | 'v2'>('v1');

  const [selectedTable, setSelectedTable] = useState<string>('Table 4 (Patio)');
  const [customTable, setCustomTable] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);
  const [showStandModal, setShowStandModal] = useState(false);
  const [menuTheme, setMenuTheme] = useState<'dark' | 'light'>('light');
  const [wifiSsid, setWifiSsid] = useState<string>('MintBistro_Guest');
  const [wifiPassword, setWifiPassword] = useState<string>('mintcom2026');
  const [activeTabMobile, setActiveTabMobile] = useState<'customer' | 'owner'>('customer');

  // V2 Live Kitchen Tickets state
  const [tickets, setTickets] = useState<KitchenTicket[]>(INITIAL_TICKETS);
  const [newTicketFlash, setNewTicketFlash] = useState(false);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const currentTable = customTable.trim() || selectedTable;
  const directMenuUrl = `${origin}/menu/demo?table=${encodeURIComponent(currentTable)}&v=${version === 'v2' ? '2' : '1'}`;

  const isStudioDark = resolvedTheme === 'dark';

  const copyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(directMenuUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    }
  };

  const toggleStudioTheme = () => {
    setTheme(isStudioDark ? 'light' : 'dark');
  };

  // Called when customer sends an order inside the phone preview
  const handleOrderPlacedFromPhone = (order: TableOrder) => {
    const newTicket: KitchenTicket = {
      id: `tick-${Date.now()}`,
      orderNumber: order.orderNumber,
      table: order.tableNumber,
      items: order.items.map((i) => ({
        name: i.menuItem.name.en,
        quantity: i.quantity,
        note: i.specialNote,
        price: i.totalPrice,
      })),
      total: order.total,
      time: order.timestamp,
      type: 'order',
      status: 'received',
    };

    setTickets((prev) => [newTicket, ...prev]);
    setNewTicketFlash(true);
    setTimeout(() => setNewTicketFlash(false), 3000);
  };

  // Called when customer calls waiter or requests bill inside phone
  const handleServiceCallFromPhone = (table: string, type: 'waiter' | 'bill') => {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const serviceTicket: KitchenTicket = {
      id: `svc-${Date.now()}`,
      orderNumber: type === 'waiter' ? 'WAITER CALL' : 'BILL REQUEST',
      table,
      items: [
        {
          name: type === 'waiter' ? 'Customer requested server assistance' : 'Customer requested receipt & payment terminal',
          quantity: 1,
          price: 0,
        },
      ],
      total: 0,
      time: now,
      type,
      status: 'received',
    };
    setTickets((prev) => [serviceTicket, ...prev]);
    setNewTicketFlash(true);
    setTimeout(() => setNewTicketFlash(false), 3000);
  };

  return (
    <>
      <Helmet>
        <title>
          {version === 'v1'
            ? 'QR Digital Menu (Version 1: View Only) | Mintcom'
            : 'QR Digital Menu (Version 2: Table Ordering) | Mintcom'}
        </title>
        <meta
          name="description"
          content="Interactive demonstration of Mintcom Digital QR Menu. Switch between Version 1 (View-Only) and Version 2 (Interactive Table Ordering)."
        />
      </Helmet>

      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-300 selection:bg-emerald-500 selection:text-white">
        {/* Top Navbar */}
        <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-white/10 px-4 py-2.5 transition-colors">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <Link
                to="/"
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1.5 text-xs font-medium border border-slate-200 dark:border-transparent"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back</span>
              </Link>

              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">
                  M
                </div>
                <div>
                  <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>QR Menu Studio</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold border transition-colors ${
                        version === 'v1'
                          ? 'bg-blue-500/15 text-blue-600 dark:text-blue-300 border-blue-500/30'
                          : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30'
                      }`}
                    >
                      {version === 'v1' ? 'Version 1: View Only' : 'Version 2: Table Ordering'}
                    </span>
                  </h1>
                </div>
              </div>
            </div>

            {/* Top Version Switcher (Pill) */}
            <div className="hidden sm:flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-white/10">
              <button
                onClick={() => setVersion('v1')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  version === 'v1'
                    ? 'bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-white/10'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-blue-500" />
                <span>Option 1: View Only</span>
              </button>
              <button
                onClick={() => setVersion('v2')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  version === 'v2'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/20 font-extrabold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Option 2: Table Ordering</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              {/* Studio Light/Dark Theme Switcher */}
              <button
                onClick={toggleStudioTheme}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors active:scale-95 shadow-2xs"
                title={isStudioDark ? 'Switch Studio to Crisp Light' : 'Switch Studio to Luxury Dark'}
              >
                {isStudioDark ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    <span className="hidden md:inline">Light</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-slate-700" />
                    <span className="hidden md:inline">Dark</span>
                  </>
                )}
              </button>

              <a
                href={directMenuUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-all active:scale-[0.98]"
              >
                <span className="hidden sm:inline">Open Fullscreen</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </header>

        {/* Presentation Header Callout Banner */}
        <div className="bg-slate-100/90 dark:bg-slate-900/60 border-b border-slate-200 dark:border-white/5 px-4 py-2.5">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-2.5 text-xs">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-black text-[11px]">
                PRESENTATION GUIDE
              </span>
              <span className="text-slate-700 dark:text-slate-300 font-medium">
                {version === 'v1' ? (
                  <>
                    <strong className="text-slate-900 dark:text-white">Version 1 (Option 1 - View Only):</strong> Zero hardware required. Guests view dishes, photos, allergens, and guest Wi-Fi.
                  </>
                ) : (
                  <>
                    <strong className="text-slate-900 dark:text-white">Version 2 (Option 2 - Interactive Table Ordering):</strong> Customers add items to cart, customize orders, send tickets to the kitchen, and call waiters.
                  </>
                )}
              </span>
            </div>

            {/* Mobile version switcher button */}
            <div className="flex sm:hidden items-center gap-2">
              <button
                onClick={() => setVersion(version === 'v1' ? 'v2' : 'v1')}
                className="px-3 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs shadow-xs"
              >
                Switch to {version === 'v1' ? 'Version 2 (Ordering)' : 'Version 1 (View)'}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile View Switcher Tabs (Only on small screens) */}
        <div className="lg:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-white/10 p-2 flex gap-2 transition-colors">
          <button
            onClick={() => setActiveTabMobile('customer')}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTabMobile === 'customer'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Customer Mobile Menu</span>
          </button>
          <button
            onClick={() => setActiveTabMobile('owner')}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTabMobile === 'owner'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Owner & Kitchen Stream</span>
          </button>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: Controls & Simulated POS / Kitchen Tickets (5 cols on lg) */}
          <div
            className={`lg:col-span-5 space-y-5 ${
              activeTabMobile === 'owner' ? 'block' : 'hidden lg:block'
            }`}
          >
            {/* Version 2 Exclusive: Live Simulated POS & Kitchen Order Stream */}
            {version === 'v2' && (
              <div
                className={`border rounded-3xl p-5 shadow-xl transition-all ${
                  newTicketFlash
                    ? 'ring-2 ring-emerald-500 bg-emerald-950/20 dark:bg-emerald-950/40 border-emerald-500'
                    : 'bg-white dark:bg-slate-900/90 border-slate-200 dark:border-white/10'
                }`}
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
                      <ChefHat className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>Live Kitchen Ticket Feed</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Reacts in real-time when orders are placed on the phone
                      </p>
                    </div>
                  </div>
                  {tickets.length > 0 && (
                    <button
                      onClick={() => setTickets([])}
                      className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg transition-colors"
                      title="Clear tickets"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="mt-3 space-y-3 max-h-80 overflow-y-auto pr-1">
                  {tickets.length === 0 ? (
                    <div className="text-center py-6 border border-dashed rounded-2xl border-slate-200 dark:border-white/10">
                      <p className="text-xs font-semibold text-slate-500">
                        No orders sent yet. Tap <em>"Add to Order"</em> on the phone preview!
                      </p>
                    </div>
                  ) : (
                    tickets.map((t) => (
                      <div
                        key={t.id}
                        className={`p-3 rounded-2xl border text-xs space-y-2 transition-all ${
                          t.type === 'waiter'
                            ? 'bg-amber-500/10 border-amber-500/30'
                            : t.type === 'bill'
                            ? 'bg-blue-500/10 border-blue-500/30'
                            : isStudioDark
                            ? 'bg-slate-950/70 border-emerald-500/30'
                            : 'bg-emerald-50/50 border-emerald-200'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-black">
                              {t.orderNumber}
                            </span>
                            <span className="text-slate-900 dark:text-white">{t.table}</span>
                          </div>
                          <span className="text-[10px] text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {t.time}
                          </span>
                        </div>

                        <div className="space-y-1 pl-1">
                          {t.items.map((it, idx) => (
                            <div key={idx} className="flex items-start justify-between text-[11px]">
                              <div>
                                <span className="font-bold text-slate-900 dark:text-white">
                                  {it.quantity}x {it.name}
                                </span>
                                {it.note && (
                                  <p className="text-[10px] text-amber-500 dark:text-amber-400 italic">
                                    "{it.note}"
                                  </p>
                                )}
                              </div>
                              {it.price > 0 && (
                                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                  {it.price.toFixed(2)} JD
                                </span>
                              )}
                            </div>
                          ))}
                        </div>

                        {t.total > 0 && (
                          <div className="flex items-center justify-between pt-1 border-t border-dashed border-slate-200 dark:border-white/10 font-bold text-xs">
                            <span className="text-slate-500">Ticket Total:</span>
                            <span className="text-emerald-600 dark:text-emerald-400">{t.total.toFixed(2)} JD</span>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Table QR Generator Card */}
            <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-white/10 rounded-3xl p-5 shadow-xs dark:shadow-xl space-y-4 transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <span>Table QR Generator</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Generate scannable QR codes for each dining table.
                  </p>
                </div>
                <button
                  onClick={() => setShowStandModal(true)}
                  className="px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 dark:bg-amber-500/20 dark:hover:bg-amber-500/30 border border-amber-500/30 dark:border-amber-500/40 text-amber-700 dark:text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Table Stand</span>
                </button>
              </div>

              {/* Table Selector Pills */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Select Dining Table:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_TABLES.map((t) => {
                    const isSelected = selectedTable === t && !customTable;
                    return (
                      <button
                        key={t}
                        onClick={() => {
                          setSelectedTable(t);
                          setCustomTable('');
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                          isSelected
                            ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                            : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 dark:hover:bg-slate-700 border border-slate-200 dark:border-white/5'
                        }`}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Table Input */}
                <div className="pt-1">
                  <input
                    type="text"
                    placeholder="Or type custom table (e.g. Poolside 5, Bar Stool 2)..."
                    value={customTable}
                    onChange={(e) => setCustomTable(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              {/* Live QR Code Preview */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-white/5 flex flex-col sm:flex-row items-center gap-4">
                <div className="p-3 bg-white rounded-2xl shadow-md shrink-0 border border-slate-200/60">
                  <QRCodeSVG
                    value={directMenuUrl}
                    size={120}
                    level="H"
                    includeMargin={true}
                    imageSettings={{
                      src: 'https://cdn-icons-png.flaticon.com/512/1046/1046784.png',
                      x: undefined,
                      y: undefined,
                      height: 24,
                      width: 24,
                      excavate: true,
                    }}
                  />
                </div>

                <div className="space-y-2 text-center sm:text-left flex-1 min-w-0">
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold">
                    <Smartphone className="w-3 h-3" />
                    <span>Scan with phone camera</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {currentTable}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 break-all line-clamp-2">
                    {directMenuUrl}
                  </p>

                  <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                    <button
                      onClick={copyLink}
                      className="px-2.5 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      {isCopied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      <span>{isCopied ? 'Copied!' : 'Copy Link'}</span>
                    </button>
                    <a
                      href={directMenuUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Test URL</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Guest Wi-Fi Configuration Section */}
              <div className="pt-2 border-t border-slate-200 dark:border-white/10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Wifi className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Guest Wi-Fi Setup</span>
                  </span>
                  <span className="text-[10px] text-slate-400">One-tap customer copy</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-500 dark:text-slate-400">Network (SSID):</label>
                    <input
                      type="text"
                      value={wifiSsid}
                      onChange={(e) => setWifiSsid(e.target.value)}
                      placeholder="e.g. MintBistro_Guest"
                      className="w-full px-2.5 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-500 dark:text-slate-400">Password:</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={wifiPassword}
                        onChange={(e) => setWifiPassword(e.target.value)}
                        placeholder="e.g. mintcom2026"
                        className="w-full px-2.5 py-1.5 pr-7 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-mono"
                      />
                      <KeyRound className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature Comparison Card */}
            <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-white/10 rounded-3xl p-5 shadow-xs dark:shadow-xl space-y-3 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                    <Sparkles className="w-4 h-4" />
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {version === 'v1' ? 'Version 1 Capabilities' : 'Version 2 Capabilities'}
                  </h3>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-500/30">
                  {version === 'v1' ? 'Zero Hardware' : 'Integrated Ordering'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-white/5 text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{version === 'v1' ? 'Pure Food Browsing' : 'Full Table Cart & Checkout'}</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-white/5 text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{version === 'v1' ? 'No Hardware Integration' : 'Direct Kitchen Ticket Dispatch'}</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-white/5 text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{version === 'v1' ? 'One-Tap Guest Wi-Fi' : 'Active Call Waiter & Bill'}</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-white/5 text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{version === 'v1' ? 'Bilingual English & Arabic' : 'Live Dish Customizations'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Interactive Smartphone Frame (7 cols on lg) */}
          <div
            className={`lg:col-span-7 flex flex-col items-center justify-center ${
              activeTabMobile === 'customer' ? 'block' : 'hidden lg:flex'
            }`}
          >
            {/* Phone Container Frame */}
            <div className="relative w-full max-w-[390px] h-[780px] bg-slate-950 rounded-[48px] p-3 shadow-2xl border-4 border-slate-300 dark:border-slate-800 ring-1 ring-black/5 dark:ring-white/10 overflow-hidden flex flex-col transition-colors">
              {/* iPhone Titanium Outer Bezel & Reflection Glow */}
              <div className="absolute inset-0 rounded-[44px] pointer-events-none border border-white/10 shadow-inner z-50" />

              {/* Dynamic Island / Camera Notch */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-full z-50 flex items-center justify-between px-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-white/10" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/40 animate-pulse" />
              </div>

              {/* Phone Status Bar (Time, Battery, Wi-Fi) */}
              <div className="w-full h-8 pt-1 px-6 flex items-center justify-between text-[11px] text-slate-300 font-semibold select-none z-40">
                <span>9:41</span>
                <div className="flex items-center gap-1.5 text-[10px]">
                  <span>5G</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Active Screen Content */}
              <div className="flex-1 w-full rounded-[36px] overflow-hidden relative z-30 bg-slate-950">
                <CustomerDigitalMenu
                  version={version}
                  tableNumber={currentTable}
                  initialTheme={menuTheme}
                  wifiName={wifiSsid}
                  wifiPass={wifiPassword}
                  onOrderPlaced={handleOrderPlacedFromPhone}
                  onCallWaiter={handleServiceCallFromPhone}
                  isEmbeddedInFrame={true}
                />
              </div>

              {/* Phone Bottom Home Bar */}
              <div className="w-full h-4 pt-1 flex justify-center items-center z-40 select-none">
                <div className="w-32 h-1 rounded-full bg-slate-700/80" />
              </div>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-3">
              👆 <em>Interactive preview ({version === 'v1' ? 'Version 1: View Only' : 'Version 2: Table Ordering'}). Tap dishes on phone!</em>
            </p>
          </div>
        </main>

        {/* Table Stand Print Modal */}
        <TableStandModal
          isOpen={showStandModal}
          onClose={() => setShowStandModal(false)}
          tableNumber={currentTable}
          qrUrl={directMenuUrl}
          wifiName={wifiSsid}
          wifiPass={wifiPassword}
        />
      </div>
    </>
  );
};
