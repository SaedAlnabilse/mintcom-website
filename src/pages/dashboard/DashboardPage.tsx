import { 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  Clock, 
  ArrowUpRight, 
  ArrowDownRight,
  Plus,
  ArrowRight,
  DollarSign,
  Package,
  Calendar
} from 'lucide-react';
import { motion } from 'framer-motion';

const stats = [
  { 
    label: 'Total Revenue', 
    value: '$12,482.00', 
    change: '+12.5%', 
    trend: 'up', 
    icon: DollarSign, 
    color: 'text-paymint-green',
    bg: 'bg-paymint-green/10'
  },
  { 
    label: 'Active Tables', 
    value: '18/24', 
    change: '75% occupancy', 
    trend: 'neutral', 
    icon: ShoppingBag, 
    color: 'text-blue-500',
    bg: 'bg-blue-500/10'
  },
  { 
    label: 'Pending Orders', 
    value: '7', 
    change: '-2 from last hour', 
    trend: 'down', 
    icon: Clock, 
    color: 'text-paymint-red',
    bg: 'bg-paymint-red/10'
  },
  { 
    label: 'Staff on Duty', 
    value: '12', 
    change: 'Full shift', 
    trend: 'up', 
    icon: Users, 
    color: 'text-purple-500',
    bg: 'bg-purple-500/10'
  },
];

const recentActivity = [
  { id: 1, type: 'order', title: 'New Order #2481', time: '2 mins ago', amount: '$42.50', status: 'Pending' },
  { id: 2, type: 'payment', title: 'Payment Received #2479', time: '15 mins ago', amount: '$128.00', status: 'Completed' },
  { id: 3, type: 'inventory', title: 'Low Stock Alert: Coffee Beans', time: '45 mins ago', amount: '5kg left', status: 'Warning' },
  { id: 4, type: 'staff', title: 'Sarah M. clocked in', time: '1 hour ago', amount: 'Shift A', status: 'Info' },
];

const popularItems = [
  { name: 'Iced Caramel Macchiato', orders: 142, revenue: '$781.00', growth: '+8%' },
  { name: 'Avocado Toast Deluxe', orders: 98, revenue: '$1,176.00', growth: '+12%' },
  { name: 'Truffle Fries', orders: 85, revenue: '$425.00', growth: '-3%' },
  { name: 'Classic Cheeseburger', orders: 76, revenue: '$912.00', growth: '+5%' },
];

export const DashboardPage = () => {
  return (
    <div className="space-y-8 pb-12">
      {/* Header section with Welcome and Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
              Dashboard
            </h1>
            <div className="flex items-center gap-2 mt-2 text-gray-500 dark:text-gray-400 font-medium">
              <Calendar size={16} />
              <span>Wednesday, January 7, 2026</span>
            </div>
          </motion.div>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 font-bold text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
            <TrendingUp size={18} />
            <span>Reports</span>
          </button>
          <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-paymint-green text-black font-black text-sm shadow-lg shadow-paymint-green/20 hover:scale-105 transition-all active:scale-95">
            <Plus size={18} />
            <span>New Order</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-6 rounded-3xl bg-white dark:bg-[#0A0A0A] border border-gray-200 dark:border-white/5 shadow-md hover:shadow-lg hover:border-gray-300 dark:hover:border-white/10 transition-all group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color} transition-colors group-hover:scale-110 duration-300`}>
                <stat.icon size={24} />
              </div>
              <div className={`flex items-center gap-1 text-xs font-black px-2 py-1 rounded-lg ${
                stat.trend === 'up' ? 'text-paymint-green bg-paymint-green/10' : 
                stat.trend === 'down' ? 'text-paymint-red bg-paymint-red/10' : 
                'text-blue-500 bg-blue-500/10'
              }`}>
                {stat.trend === 'up' && <ArrowUpRight size={14} />}
                {stat.trend === 'down' && <ArrowDownRight size={14} />}
                {stat.change}
              </div>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-3xl font-black text-gray-900 dark:text-white mt-1">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
              Recent Activity
              <span className="px-2 py-0.5 rounded-full bg-paymint-green/10 text-paymint-green text-[10px] font-black uppercase tracking-widest">Live</span>
            </h2>
            <button className="text-sm font-bold text-paymint-green hover:underline">View All</button>
          </div>
          
          <div className="bg-white dark:bg-[#0A0A0A] rounded-3xl border border-gray-200 dark:border-white/5 overflow-hidden shadow-md">
            <div className="divide-y divide-gray-100 dark:divide-white/5">
              {recentActivity.map((item) => (
                <div key={item.id} className="p-5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gray-200 dark:bg-white/5 border border-gray-300 dark:border-transparent flex items-center justify-center text-gray-600 dark:text-gray-400 font-bold group-hover:bg-paymint-green/20 group-hover:text-paymint-green group-hover:border-paymint-green/30 transition-colors">
                      {item.type === 'order' && <ShoppingBag size={20} />}
                      {item.type === 'payment' && <DollarSign size={20} />}
                      {item.type === 'inventory' && <Package size={20} />}
                      {item.type === 'staff' && <Users size={20} />}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white">{item.title}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="font-medium">{item.time}</span>
                        <span>•</span>
                        <span className={`px-2 py-0.5 rounded-md font-bold uppercase tracking-tighter text-[10px] ${
                          item.status === 'Completed' ? 'bg-paymint-green/10 text-paymint-green' :
                          item.status === 'Pending' ? 'bg-orange-500/10 text-orange-500' :
                          item.status === 'Warning' ? 'bg-paymint-red/10 text-paymint-red' :
                          'bg-blue-500/10 text-blue-500'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-gray-900 dark:text-white">{item.amount}</p>
                    <button className="text-gray-400 hover:text-paymint-green transition-colors">
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Popular Items */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-black text-gray-900 dark:text-white">Popular Items</h2>
            <button className="text-sm font-bold text-paymint-green hover:underline">Analytics</button>
          </div>
          
          <div className="bg-white dark:bg-[#0A0A0A] rounded-3xl border border-gray-200 dark:border-white/5 p-6 shadow-md space-y-6">
            {popularItems.map((item, index) => (
              <div key={item.name} className="space-y-2">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white">{item.name}</p>
                    <p className="text-xs text-gray-500 font-medium">{item.orders} orders this week</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-gray-900 dark:text-white">{item.revenue}</p>
                    <p className={`text-[10px] font-black ${item.growth.startsWith('+') ? 'text-paymint-green' : 'text-paymint-red'}`}>
                      {item.growth}
                    </p>
                  </div>
                </div>
                <div className="w-full h-1.5 bg-gray-200 dark:bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.random() * 40 + 60}%` }}
                    transition={{ duration: 1, delay: index * 0.1 }}
                    className="h-full bg-paymint-green rounded-full"
                  />
                </div>
              </div>
            ))}
            
            <button className="w-full py-3 mt-4 rounded-2xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-transparent text-gray-700 dark:text-gray-300 font-bold text-sm hover:bg-paymint-green hover:text-black hover:border-paymint-green transition-all group">
              View All Menu Performance
            </button>
          </div>

          {/* Quick Support Card */}
          <div className="bg-gray-900 dark:bg-paymint-green rounded-3xl p-6 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform duration-500">
              <TrendingUp size={120} className="text-white dark:text-black" />
            </div>
            <div className="relative z-10">
              <h3 className="text-white dark:text-black font-black text-xl leading-tight">Need help optimizing your sales?</h3>
              <p className="text-gray-400 dark:text-black/60 text-sm mt-2 font-medium">Book a free session with our business experts.</p>
              <button className="mt-4 px-6 py-2 rounded-xl bg-white dark:bg-black text-black dark:text-white font-black text-xs uppercase tracking-widest hover:scale-105 transition-transform">
                Learn More
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};