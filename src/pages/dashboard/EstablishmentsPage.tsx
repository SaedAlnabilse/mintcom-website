import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Store,
  Plus,
  MoreVertical,
  DollarSign,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

interface Establishment {
  id: string;
  name: string;
  type: string;
  currency: string;
  address?: string;
  phone?: string;
  subscriptionStatus: string;
  trialEndDate?: string;
  employeeCount?: number;
}

export function EstablishmentsPage() {
  const navigate = useNavigate();
  const { establishments, currentEstablishment, setCurrentEstablishment } = useAuth();
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-500 bg-green-500/10';
      case 'trial':
        return 'text-yellow-500 bg-yellow-500/10';
      case 'past_due':
        return 'text-red-500 bg-red-500/10';
      case 'cancelled':
        return 'text-gray-500 bg-gray-500/10';
      default:
        return 'text-gray-500 bg-gray-500/10';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'trial':
        return 'Trial';
      case 'past_due':
        return 'Past Due';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const handleSelectEstablishment = (est: Establishment) => {
    setCurrentEstablishment(est as any);
    toast.success(`Switched to ${est.name}`);
  };

  return (
    <div className="p-6 overflow-y-auto h-full">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Establishments</h1>
            <p className="text-gray-400">Manage your businesses and locations</p>
          </div>
          <button
            onClick={() => navigate('/onboarding')}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Establishment
          </button>
        </div>

        {/* Establishments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {establishments.map((est) => (
            <motion.div
              key={est.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-gray-800 rounded-xl p-6 border-2 transition-colors ${currentEstablishment?.id === est.id
                  ? 'border-green-500'
                  : 'border-transparent hover:border-gray-700'
                }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-600/20 rounded-xl flex items-center justify-center">
                    <Store className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{est.name}</h3>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(est.subscriptionStatus)}`}>
                      {getStatusLabel(est.subscriptionStatus)}
                    </span>
                  </div>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setOpenMenuId(openMenuId === est.id ? null : est.id)}
                    className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <MoreVertical className="w-5 h-5 text-gray-400" />
                  </button>
                  {openMenuId === est.id && (
                    <div className="absolute right-0 mt-1 w-48 bg-gray-700 rounded-lg shadow-lg z-10 overflow-hidden">
                      <button
                        onClick={() => {
                          handleSelectEstablishment(est);
                          setOpenMenuId(null);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-600 transition-colors"
                      >
                        Switch to this
                      </button>
                      <button
                        onClick={() => {
                          navigate('/dashboard/settings');
                          setOpenMenuId(null);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-600 transition-colors"
                      >
                        Settings
                      </button>
                      <button
                        onClick={() => {
                          navigate('/dashboard/staff');
                          setOpenMenuId(null);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-600 transition-colors"
                      >
                        Manage Staff
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Details */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <DollarSign className="w-4 h-4" />
                  <span>{est.currency}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400 text-sm capitalize">
                  <Store className="w-4 h-4" />
                  <span>{est.type.replace('_', ' ')}</span>
                </div>
              </div>

              {/* Trial Info */}
              {est.subscriptionStatus === 'trial' && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-4">
                  <p className="text-yellow-500 text-sm">
                    <AlertCircle className="w-4 h-4 inline mr-1" />
                    Trial ends soon
                  </p>
                </div>
              )}

              {/* Action Button */}
              {currentEstablishment?.id === est.id ? (
                <div className="flex items-center justify-center gap-2 py-2 text-green-500">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Currently Active</span>
                </div>
              ) : (
                <button
                  onClick={() => handleSelectEstablishment(est)}
                  className="w-full py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Switch to this
                </button>
              )}
            </motion.div>
          ))}

          {/* Add New Card */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => navigate('/onboarding')}
            className="bg-gray-800/50 border-2 border-dashed border-gray-700 rounded-xl p-6 flex flex-col items-center justify-center gap-4 hover:border-green-500 hover:bg-gray-800 transition-all min-h-[250px]"
          >
            <div className="w-16 h-16 bg-green-600/20 rounded-full flex items-center justify-center">
              <Plus className="w-8 h-8 text-green-500" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-white mb-1">Add Establishment</h3>
              <p className="text-gray-400 text-sm">$20/month per establishment</p>
            </div>
          </motion.button>
        </div>

        {/* Info Section */}
        <div className="mt-12 bg-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">About Multiple Establishments</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="text-white font-medium mb-2">Separate Data</h4>
              <p className="text-gray-400 text-sm">
                Each establishment has its own menu, orders, staff, and reports. Data is kept completely separate.
              </p>
            </div>
            <div>
              <h4 className="text-white font-medium mb-2">Shared Employees</h4>
              <p className="text-gray-400 text-sm">
                Assign employees to multiple establishments. They'll be able to work at any location you assign them to.
              </p>
            </div>
            <div>
              <h4 className="text-white font-medium mb-2">Brands & Groups</h4>
              <p className="text-gray-400 text-sm">
                Create brands to group related establishments and share employees across them more easily.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
