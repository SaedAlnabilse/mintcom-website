import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

type LoginStep = 'tenant' | 'user';

export function LoginPage() {
  const navigate = useNavigate();
  const { verifyTenant, login, tenant } = useAuth();

  const [step, setStep] = useState<LoginStep>('tenant');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Tenant form state
  const [restaurantId, setRestaurantId] = useState('');
  const [restaurantPassword, setRestaurantPassword] = useState('');

  // User form state
  const [username, setUsername] = useState('');
  const [userPassword, setUserPassword] = useState('');

  const handleTenantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await verifyTenant(restaurantId, restaurantPassword);

    setIsLoading(false);
    if (result.success) {
      setStep('user');
    } else {
      setError(result.error || 'Failed to verify restaurant');
    }
  };

  const handleUserLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await login(username, userPassword);

    setIsLoading(false);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error || 'Login failed');
    }
  };

  const goBackToTenant = () => {
    setStep('tenant');
    setUsername('');
    setUserPassword('');
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Pay<span className="text-green-500">Mint</span>
          </h1>
          <p className="text-gray-400">Back Office Portal</p>
        </div>

        {/* Login Card */}
        <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden">
          {/* Step Indicator */}
          <div className="flex border-b border-gray-700">
            <div
              className={`flex-1 py-4 text-center font-medium transition-colors ${
                step === 'tenant'
                  ? 'text-green-500 bg-gray-700/50'
                  : 'text-gray-500'
              }`}
            >
              1. Restaurant
            </div>
            <div
              className={`flex-1 py-4 text-center font-medium transition-colors ${
                step === 'user'
                  ? 'text-green-500 bg-gray-700/50'
                  : 'text-gray-500'
              }`}
            >
              2. Login
            </div>
          </div>

          <div className="p-8">
            {step === 'tenant' ? (
              /* Tenant Verification Form */
              <form onSubmit={handleTenantSubmit} className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-white mb-2">
                    Select Your Restaurant
                  </h2>
                  <p className="text-gray-400 text-sm">
                    Enter your restaurant ID and password to continue
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Restaurant ID
                    </label>
                    <input
                      type="text"
                      value={restaurantId}
                      onChange={(e) => setRestaurantId(e.target.value)}
                      placeholder="e.g., cafe-aroma"
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Restaurant Password
                    </label>
                    <input
                      type="password"
                      value={restaurantPassword}
                      onChange={(e) => setRestaurantPassword(e.target.value)}
                      placeholder="Enter restaurant password"
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
                    <p className="text-red-400 text-sm text-center">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Verifying...
                    </>
                  ) : (
                    'Continue'
                  )}
                </button>
              </form>
            ) : (
              /* User Login Form */
              <form onSubmit={handleUserLogin} className="space-y-6">
                <div>
                  <button
                    type="button"
                    onClick={goBackToTenant}
                    className="text-gray-400 hover:text-white text-sm flex items-center gap-1 mb-4"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back
                  </button>
                  <h2 className="text-xl font-semibold text-white mb-2">
                    Welcome to {tenant?.name}
                  </h2>
                  <p className="text-gray-400 text-sm">
                    Enter your credentials to access the dashboard
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Username
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter your username"
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Password / PIN
                    </label>
                    <input
                      type="password"
                      value={userPassword}
                      onChange={(e) => setUserPassword(e.target.value)}
                      placeholder="Enter your password or PIN"
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
                    <p className="text-red-400 text-sm text-center">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-sm mt-6">
          Need help?{' '}
          <a href="mailto:support@paymint.com" className="text-green-500 hover:underline">
            Contact Support
          </a>
        </p>
      </div>
    </div>
  );
}
