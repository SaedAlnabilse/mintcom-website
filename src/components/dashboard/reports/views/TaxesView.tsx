import { Scale } from 'lucide-react';
import { useCurrency } from '../../../../context/CurrencyContext';
import type { SalesSummary } from '../../../../types';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { AnalyticsEmptyState } from '../AnalyticsEmptyState';

interface TaxesViewProps {
  salesData: SalesSummary;
}

export const TaxesView = React.memo(function TaxesView({ salesData }: TaxesViewProps) {
  const { t } = useTranslation();
  const { currencySymbol } = useCurrency();
  const taxBreakdown = salesData.taxBreakdown || [];
  const totalTax = salesData.taxCollected ?? 0;
  const grossSales = salesData.totalRevenue ?? 0;
  const taxableSales = Math.max(grossSales - totalTax, 0);
  const averageTaxRate = taxableSales > 0 ? totalTax / taxableSales : 0;
  const hasTaxBreakdown = taxBreakdown.length > 0;
  const hasTaxActivity =
    taxBreakdown.some((tax: any) => Number(tax?.collected ?? 0) > 0 || Number(tax?.taxableAmount ?? 0) > 0) ||
    totalTax > 0 ||
    grossSales > 0 ||
    (salesData.totalOrders ?? 0) > 0;

  const formatCurrency = (value: number) => (
    <span className="inline-flex items-baseline gap-1">
      <span className="font-bold tracking-tight">
        {value.toLocaleString(t('common.locale'), { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{currencySymbol}</span>
    </span>
  );

  return (
    <div className="space-y-6" dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}>
      {/* Summary Cards for Taxes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 sm:p-5 bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/[0.03] relative overflow-hidden flex flex-col transition-all duration-300">
          <div className="relative z-10">
            <p className="dashboard-stat-title mb-1">{t('orders.reports.taxes.totalTax')}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
              {formatCurrency(totalTax)}
            </p>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">{t('orders.reports.taxes.totalTaxDesc')}</p>
          </div>
          <div className="absolute end-0 top-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl -me-10 -mt-10 pointer-events-none" />
        </div>

        <div className="p-4 sm:p-5 bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/[0.03] relative overflow-hidden flex flex-col transition-all duration-300">
          <div className="relative z-10">
            <p className="dashboard-stat-title mb-1">{t('orders.reports.taxes.taxableSales')}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
              {formatCurrency(taxableSales)}
            </p>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">{t('orders.reports.taxes.taxableSalesDesc')}</p>
          </div>
          <div className="absolute end-0 top-0 w-32 h-32 bg-mintcom-green/10 rounded-full blur-3xl -me-10 -mt-10 pointer-events-none" />
        </div>

        <div className="p-4 sm:p-5 bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/[0.03] relative overflow-hidden flex flex-col transition-all duration-300">
          <div className="relative z-10">
            <p className="dashboard-stat-title mb-1">{t('orders.reports.taxes.avgRate')}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
              {taxableSales > 0
                ? averageTaxRate.toLocaleString(t('common.locale'), { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 })
                : (0).toLocaleString(t('common.locale'), { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 })}
            </p>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">{t('orders.reports.taxes.avgRateDesc')}</p>
          </div>
          <div className="absolute end-0 top-0 w-32 h-32 bg-mintcom-green/10 rounded-full blur-3xl -me-10 -mt-10 pointer-events-none" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tax Breakdown Main Card */}
        <div className="lg:col-span-2 bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/[0.03] shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-100 dark:border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                <Scale size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {t('orders.reports.taxes.details')}
                </h3>
                <p className="text-xs text-gray-500 mt-1">{t('orders.reports.taxes.share')}</p>
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-white/[0.02]">
                <tr>
                  <th className="px-6 py-4 text-start label-strong font-outfit">{t('orders.reports.taxes.type')}</th>
                  <th className="px-6 py-4 text-end label-strong font-outfit">{t('orders.reports.taxes.rate')}</th>
                  <th className="px-6 py-4 text-end label-strong font-outfit">{t('orders.reports.taxes.taxable')}</th>
                  <th className="px-6 py-4 text-end label-strong font-outfit">{t('orders.reports.taxes.tax')}</th>
                  <th className="px-6 py-4 text-center label-strong font-outfit">{t('orders.reports.taxes.share')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {/* NOTE: If backend doesn't provide granular tax breakdown, we reconstruct a "Sales Tax" default row */}
                {hasTaxBreakdown ? (
                  taxBreakdown.map((tax: any, i: number) => {
                    const taxName = String(tax.name ?? tax.taxName ?? tax.category ?? 'Tax');
                    const rawRate = Number(tax.rate ?? 0);
                    const displayRate = Number.isFinite(rawRate) ? (rawRate > 1 ? rawRate / 100 : rawRate) : 0;
                    const taxableAmount = Number(tax.taxableAmount ?? tax.amount ?? 0);
                    const collected = Number(tax.collected ?? tax.taxAmount ?? tax.value ?? 0);
                    const contribution = totalTax > 0 ? (collected / totalTax) * 100 : 0;
                    return (
                      <tr key={i} className="group hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4 text-start">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-100 dark:bg-white/5 text-gray-500 font-bold">
                              {taxName.charAt(0)}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-sm text-gray-900 dark:text-white">{taxName}</span>
                              <span className="text-xs text-gray-400 font-bold">{(tax.transactions ?? 0).toLocaleString(t('common.locale'))} {t('orders.reports.taxes.txns')}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-end font-bold text-gray-500">
                          {displayRate.toLocaleString(t('common.locale'), { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                        </td>
                        <td className="px-6 py-4 text-end font-bold text-gray-900 dark:text-white">
                          {formatCurrency(Number.isFinite(taxableAmount) ? taxableAmount : 0)}
                        </td>
                        <td className="px-6 py-4 text-end font-bold text-orange-500">
                          {formatCurrency(Number.isFinite(collected) ? collected : 0)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 max-w-[100px] mx-auto">
                            <div className="flex-1 h-1.5 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                              <div className="h-full bg-orange-500 rounded-full" style={{ width: `${contribution}%` }} />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : hasTaxActivity ? (
                  // Default Fallback Row if no granular data
                  <tr className="group hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 text-start">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-100 dark:bg-white/5 text-gray-500 font-bold">
                          {t('orders.reports.taxes.standardTax').charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm text-gray-900 dark:text-white">{t('orders.reports.taxes.standardTax')}</span>
                          <span className="text-xs text-gray-400 font-bold">{(salesData.totalOrders ?? 0).toLocaleString(t('common.locale'))} {t('orders.reports.taxes.txns')}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-end font-bold text-gray-500">
                      {(taxableSales > 0 ? averageTaxRate : 0).toLocaleString(t('common.locale'), { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                    </td>
                    <td className="px-6 py-4 text-end font-bold text-gray-900 dark:text-white">
                      {formatCurrency(taxableSales)}
                    </td>
                    <td className="px-6 py-4 text-end font-bold text-orange-500">
                      {formatCurrency(totalTax)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 max-w-[100px] mx-auto">
                        <div className="flex-1 h-1.5 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-orange-500 rounded-full" style={{ width: `100%` }} />
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-14">
                      <AnalyticsEmptyState
                        icon={Scale}
                        title={t('orders.reports.taxes.noData')}
                        description={t('orders.reports.taxes.noDataDesc')}
                        compact
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Exemptions Panel */}
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/[0.03] shadow-sm p-6 flex flex-col">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
            {t('orders.reports.taxes.exemptions')}
          </h3>
          <p className="text-xs text-gray-500 mb-6">{t('orders.reports.taxes.exemptionsDesc')}</p>

          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 py-8">
            <div className="w-16 h-16 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-300 dark:text-white/20">
              <Scale size={24} />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900 dark:text-white">
                {formatCurrency(salesData.taxExemptSales ?? 0)}
              </p>
              <p className="text-xs font-bold text-gray-400 tracking-widest mt-1">{t('orders.reports.taxes.taxFreeSales')}</p>
            </div>
            <div className="w-full h-px bg-gray-100 dark:bg-white/5 my-4" />
            <div className="w-full space-y-3">
              {/* Mock list of exemptions or actual data if available */}
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-gray-500">{t('orders.reports.taxes.resaleCertificates')}</span>
                <span className="font-bold text-gray-900 dark:text-white">�</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-gray-500">{t('orders.reports.taxes.nonProfit')}</span>
                <span className="font-bold text-gray-900 dark:text-white">�</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-gray-500">{t('orders.reports.taxes.govEntities')}</span>
                <span className="font-bold text-gray-900 dark:text-white">�</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});


