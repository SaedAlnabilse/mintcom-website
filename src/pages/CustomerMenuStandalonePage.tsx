import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { CustomerDigitalMenu } from '../components/qr-menu/CustomerDigitalMenu';
import { RESTAURANT_INFO } from '../components/qr-menu/menuData';
import { Sparkles, Utensils, ShoppingCart } from 'lucide-react';

export const CustomerMenuStandalonePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Extract table from query param (e.g. ?table=Table 4 or ?table=4)
  const tableParam = searchParams.get('table') || 'Table 4';
  const themeParam = (searchParams.get('theme') as 'dark' | 'light') || 'light';
  const initialV = searchParams.get('v') === '2' ? 'v2' : 'v1';
  const [version, setVersion] = useState<'v1' | 'v2'>(initialV);

  useEffect(() => {
    const v = searchParams.get('v') === '2' ? 'v2' : 'v1';
    setVersion(v);
  }, [searchParams]);

  const toggleVersion = () => {
    const nextV = version === 'v1' ? 'v2' : 'v1';
    setVersion(nextV);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('v', nextV === 'v2' ? '2' : '1');
    setSearchParams(newParams, { replace: true });
  };

  const tableLabel = tableParam.toLowerCase().startsWith('table')
    ? tableParam
    : `Table ${tableParam}`;

  return (
    <>
      <Helmet>
        <title>{`${RESTAURANT_INFO.name.en} | Digital QR Menu (${version === 'v1' ? 'View Only' : 'Ordering'})`}</title>
        <meta
          name="description"
          content={`Browse the live digital menu for ${RESTAURANT_INFO.name.en}. High resolution photos, pricing, allergens, and table service.`}
        />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </Helmet>

      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col items-center transition-colors">
        {/* Mobile-optimized centered container */}
        <div className="w-full max-w-lg min-h-screen shadow-2xl relative">
          <CustomerDigitalMenu
            version={version}
            tableNumber={tableLabel}
            initialTheme={themeParam}
            isEmbeddedInFrame={false}
          />
        </div>

        {/* Demo Quick-Switcher Pill (Floating bottom corner so user can switch versions when presenting on phone) */}
        <div className="fixed bottom-2 right-2 z-50">
          <button
            onClick={toggleVersion}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-white/20 shadow-xl backdrop-blur-md text-[11px] font-bold transition-all active:scale-95"
            title="Click to toggle between Version 1 (View-Only) and Version 2 (Table Ordering)"
          >
            {version === 'v1' ? (
              <>
                <Utensils className="w-3 h-3 text-emerald-400" />
                <span>V1 (View) ➔ <span className="text-emerald-400">Switch to V2 (Ordering)</span></span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-3 h-3 text-amber-400" />
                <span>V2 (Ordering) ➔ <span className="text-amber-400">Switch to V1 (View)</span></span>
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
};
