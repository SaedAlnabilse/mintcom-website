import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Wallet, CreditCard } from 'lucide-react';
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useTheme } from '../../../context/ThemeContext';
import { useTranslation } from 'react-i18next';

interface PaymentMethodsBreakdownProps {
  paymentMethodBreakdown: { name: string; value: number }[];
  viewMode: 'current_shift' | 'previous_shift' | 'last_24_hours';
}

const COLORS = ['#7CC39F', '#3b82f6', '#f59e0b', '#D55263', '#8b5cf6', '#ec4899'];

export const PaymentMethodsBreakdown = React.memo(function PaymentMethodsBreakdown({ paymentMethodBreakdown, viewMode }: PaymentMethodsBreakdownProps) {
  const { t } = useTranslation();
  const { locationSlug } = useParams();
  const navigate = useNavigate();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <div id="tour-capital-sources" className="group relative p-4 sm:p-6 bg-white dark:bg-[#0B1120] rounded-2xl border border-gray-200 dark:border-white/[0.03] shadow-sm flex flex-col transition-all duration-300 overflow-hidden">
      <div className="absolute top-0 end-0 w-40 h-40 bg-paymint-green/5 rounded-full blur-3xl opacity-0 transition-opacity duration-500 pointer-events-none" />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-paymint-green/10 flex items-center justify-center text-paymint-green transition-transform duration-300">
              <Wallet size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('dashboard.paymentMethods.title')}</h3>
              <p className="text-xs font-bold text-gray-500 tracking-wide">
                {viewMode === 'current_shift' ? t('dashboard.stats.thisShift') : viewMode === 'previous_shift' ? t('dashboard.stats.previousShift') : t('dashboard.stats.last24h')} {t('dashboard.paymentMethods.distribution')}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate(`/dashboard/${locationSlug}/reports/payments`)}
            className="text-xs font-bold text-paymint-green hover:underline tracking-wide"
          >
            {t('common.viewAll')}
          </button>
        </div>

        <div className="flex-1 flex flex-col justify-center">
          {paymentMethodBreakdown && paymentMethodBreakdown.length > 0 ? (
            <>
              <div className="h-[160px] w-full" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie>
                    <Pie
                      data={paymentMethodBreakdown}
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                    >
                      {paymentMethodBreakdown.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? '#0B1120' : '#fff',
                        borderRadius: '12px',
                        border: 'none',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                        fontSize: '12px'
                      }}
                      itemStyle={{ color: isDark ? '#fff' : '#111', fontWeight: 'bold' }}
                    />
                  </RechartsPie>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-4">
                {paymentMethodBreakdown.slice(0, 3).map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{item.name}</span>
                    </div>
                    <span className="text-xs font-bold text-gray-900 dark:text-white">{item.value.toLocaleString(t('common.locale'), { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <CreditCard size={32} className="mb-3 opacity-20" />
              <p className="text-xs font-bold tracking-wide">{t('dashboard.paymentMethods.noData')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});