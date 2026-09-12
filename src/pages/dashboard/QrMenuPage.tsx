import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  QrCode,
  Smartphone,
  Printer,
  Download,
  Plus,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  Wifi,
  KeyRound,
  Sun,
  Moon,
  Sliders,
  Sparkles,
  Layers,
  MapPin,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { CustomerDigitalMenu } from '../../components/qr-menu/CustomerDigitalMenu';
import { TableStandModal } from '../../components/qr-menu/TableStandModal';
import { RESTAURANT_INFO } from '../../components/qr-menu/menuData';

interface TableItem {
  id: string;
  name: string;
  section: string;
}

const INITIAL_TABLES: TableItem[] = [
  { id: 't1', name: 'Table 1', section: 'Main Dining' },
  { id: 't2', name: 'Table 2', section: 'Main Dining' },
  { id: 't3', name: 'Table 3', section: 'Main Dining' },
  { id: 't4', name: 'Table 4', section: 'Patio Terrace' },
  { id: 't5', name: 'Table 5', section: 'Patio Terrace' },
  { id: 't6', name: 'Table 6', section: 'Outdoor Garden' },
  { id: 't12', name: 'Table 12', section: 'VIP Lounge' },
];

export const QrMenuPage: React.FC = () => {
  const [tables, setTables] = useState<TableItem[]>(INITIAL_TABLES);
  const [selectedTable, setSelectedTable] = useState<TableItem>(INITIAL_TABLES[3]); // Table 4
  const [newTableName, setNewTableName] = useState('');
  const [newTableSection, setNewTableSection] = useState('Main Dining');
  const [isAddingTable, setIsAddingTable] = useState(false);

  // Operation tier mode
  const [menuVersion, setMenuVersion] = useState<'v1' | 'v2'>('v1');

  // Settings state
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>('light');
  const [wifiSsid, setWifiSsid] = useState('MintBistro_Guest');
  const [wifiPass, setWifiPass] = useState('mintcom2026');

  // Modals & clipboard
  const [showStandModal, setShowStandModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const directMenuUrl = `${origin}/menu/demo?table=${encodeURIComponent(selectedTable.name)}&v=${menuVersion === 'v2' ? '2' : '1'}`;

  const handleAddTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableName.trim()) return;
    const newT: TableItem = {
      id: `t-${Date.now()}`,
      name: newTableName.trim(),
      section: newTableSection,
    };
    setTables((prev) => [...prev, newT]);
    setSelectedTable(newT);
    setNewTableName('');
    setIsAddingTable(false);
  };

  const handleDeleteTable = (id: string) => {
    if (tables.length <= 1) return;
    setTables((prev) => prev.filter((t) => t.id !== id));
    if (selectedTable.id === id) {
      setSelectedTable(tables[0]);
    }
  };

  const copyUrl = (url: string, id: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  return (
    <>
      <Helmet>
        <title>QR Menu & Tables | Mintcom Dashboard</title>
      </Helmet>

      <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <QrCode className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  QR Menu & Tables
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Manage table QR codes, guest Wi-Fi credentials, and live digital menu settings.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowStandModal(true)}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-emerald-950/30 active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Print Table Stand</span>
            </button>

            <a
              href={directMenuUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-200 dark:border-white/10"
            >
              <span>Live Menu</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Overview Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-xs">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Configured Tables</span>
            <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">{tables.length} Tables</div>
            <span className="text-[10px] text-emerald-500 font-semibold mt-0.5 block">Ready for QR scanning</span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-xs">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Digital Menu Status</span>
            <div className="text-xl font-bold text-emerald-500 mt-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Published</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">No app install required</span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-xs">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Default Menu Theme</span>
            <div className="text-xl font-bold text-slate-900 dark:text-white mt-1 capitalize flex items-center gap-1.5">
              {themeMode === 'dark' ? <Moon className="w-4 h-4 text-emerald-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
              <span>{themeMode === 'dark' ? 'Dark Luxury' : 'Crisp Light'}</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Customer toggle available</span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-xs">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Guest Wi-Fi Setup</span>
            <div className="text-sm font-mono font-bold text-slate-900 dark:text-white mt-1 truncate">
              {wifiSsid}
            </div>
            <span className="text-[10px] text-emerald-500 font-medium mt-0.5 block">Pass: {wifiPass}</span>
          </div>
        </div>

        {/* Main 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT: Tables & Settings (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Table Management Card */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    Dining Tables & QR Codes
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Click a table to preview its menu and QR code.
                  </p>
                </div>
                <button
                  onClick={() => setIsAddingTable(!isAddingTable)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Table</span>
                </button>
              </div>

              {/* Add Table Form Drawer */}
              {isAddingTable && (
                <form onSubmit={handleAddTable} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 space-y-3 animate-in fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">Table Name / Number:</label>
                      <input
                        type="text"
                        value={newTableName}
                        onChange={(e) => setNewTableName(e.target.value)}
                        placeholder="e.g. Table 8 or Patio 3"
                        className="w-full px-3 py-1.5 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">Dining Section:</label>
                      <select
                        value={newTableSection}
                        onChange={(e) => setNewTableSection(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value="Main Dining">Main Dining</option>
                        <option value="Patio Terrace">Patio Terrace</option>
                        <option value="Outdoor Garden">Outdoor Garden</option>
                        <option value="VIP Lounge">VIP Lounge</option>
                        <option value="Bar / Counter">Bar / Counter</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingTable(false)}
                      className="px-3 py-1 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold shadow"
                    >
                      Save Table
                    </button>
                  </div>
                </form>
              )}

              {/* Table Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-80 overflow-y-auto pr-1">
                {tables.map((t) => {
                  const isSelected = selectedTable.id === t.id;
                  const tUrl = `${origin}/menu/demo?table=${encodeURIComponent(t.name)}&v=${menuVersion === 'v2' ? '2' : '1'}`;
                  return (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTable(t)}
                      className={`p-3 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-emerald-500/10 border-emerald-500/50 dark:bg-emerald-500/15 shadow-sm'
                          : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-800/80 border-slate-200 dark:border-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {/* Mini QR preview */}
                        <div className="p-1 rounded-lg bg-white border border-slate-200 shrink-0">
                          <QRCodeSVG value={tUrl} size={36} />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span>{t.name}</span>
                            {isSelected && (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">{t.section}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => copyUrl(tUrl, t.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                          title="Copy Link"
                        >
                          {copiedId === t.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        {tables.length > 1 && (
                          <button
                            onClick={() => handleDeleteTable(t.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Appearance, Mode & Wi-Fi Configuration Card */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-xs space-y-4">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-500" />
                <span>Operational Mode & Menu Settings</span>
              </h2>

              {/* Version Mode Selector */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  QR Menu Experience Tier:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMenuVersion('v1')}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      menuVersion === 'v1'
                        ? 'bg-emerald-500/10 border-emerald-500 text-slate-900 dark:text-white shadow-sm ring-1 ring-emerald-500/50'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="text-xs font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      <span>Level 1: View Only</span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      Zero hardware. Guests browse photos, prices, allergens & Wi-Fi.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMenuVersion('v2')}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      menuVersion === 'v2'
                        ? 'bg-emerald-500/10 border-emerald-500 text-slate-900 dark:text-white shadow-sm ring-1 ring-emerald-500/50'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="text-xs font-bold flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>Level 2: Table Ordering</span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      Table cart, custom options, direct kitchen tickets & waiter calls.
                    </p>
                  </button>
                </div>
              </div>

              {/* Theme Toggle (Light / Dark Mode) */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Default Customer Menu Appearance:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setThemeMode('dark')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border transition-all ${
                      themeMode === 'dark'
                        ? 'bg-slate-900 border-emerald-500 text-emerald-400 shadow-md font-bold'
                        : 'bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Dark Luxury</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setThemeMode('light')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border transition-all ${
                      themeMode === 'light'
                        ? 'bg-white border-emerald-500 text-slate-900 shadow-md font-bold'
                        : 'bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                    <span>Crisp Light</span>
                  </button>
                </div>
              </div>

              {/* Guest Wi-Fi Setup */}
              <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-white/10">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Wifi className="w-4 h-4 text-emerald-500" />
                    <span>Guest Wi-Fi Setup:</span>
                  </label>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Auto-synced on table stands</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">Wi-Fi Network Name (SSID):</span>
                    <input
                      type="text"
                      value={wifiSsid}
                      onChange={(e) => setWifiSsid(e.target.value)}
                      placeholder="e.g. MintBistro_Guest"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-white/10 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">Wi-Fi Password:</span>
                    <div className="relative">
                      <KeyRound className="absolute top-1/2 -translate-y-1/2 left-3 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="text"
                        value={wifiPass}
                        onChange={(e) => setWifiPass(e.target.value)}
                        placeholder="e.g. mintcom2026"
                        className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-white/10 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Live Interactive Phone Preview (5 cols) */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-2 px-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-emerald-500" />
                <span>Live Preview: {selectedTable.name}</span>
              </span>
              <a
                href={directMenuUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-emerald-500 hover:underline flex items-center gap-1 font-medium"
              >
                <span>Fullscreen</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* iPhone Frame */}
            <div className="relative w-full max-w-[360px] h-[720px] bg-slate-950 rounded-[44px] p-2.5 shadow-2xl border-4 border-slate-800 ring-1 ring-white/10 overflow-hidden flex flex-col">
              {/* Dynamic Island */}
              <div className="absolute top-3.5 left-1/2 -translate-x-1/2 w-24 h-5 bg-black rounded-full z-50 flex items-center justify-between px-2">
                <div className="w-2 h-2 rounded-full bg-slate-900 border border-white/10" />
                <div className="w-2 h-2 rounded-full bg-emerald-500/40" />
              </div>

              {/* Status bar */}
              <div className="w-full h-7 pt-1 px-5 flex items-center justify-between text-[10px] text-slate-400 font-semibold select-none z-40">
                <span>9:41</span>
                <span>5G</span>
              </div>

              {/* Embedded Customer Menu */}
              <div className="flex-1 w-full rounded-[32px] overflow-hidden relative z-30 bg-slate-950">
                <CustomerDigitalMenu
                  version={menuVersion}
                  tableNumber={selectedTable.name}
                  initialTheme={themeMode}
                  wifiName={wifiSsid}
                  wifiPass={wifiPass}
                  isEmbeddedInFrame={true}
                />
              </div>

              {/* Home indicator bar */}
              <div className="w-full h-3 pt-0.5 flex justify-center items-center z-40 select-none">
                <div className="w-28 h-1 rounded-full bg-slate-700/80" />
              </div>
            </div>
          </div>
        </div>

        {/* Table Stand Print Modal */}
        <TableStandModal
          isOpen={showStandModal}
          onClose={() => setShowStandModal(false)}
          tableNumber={selectedTable.name}
          qrUrl={directMenuUrl}
          wifiName={wifiSsid}
          wifiPass={wifiPass}
        />
      </div>
    </>
  );
};
