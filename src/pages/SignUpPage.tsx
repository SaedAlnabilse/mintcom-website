import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import api from '../config/api';
import toast from 'react-hot-toast';

interface SignUpFormData {
  restaurantName: string;
  ownerName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  slug: string;
  restaurantPassword: string;
  plan: string;
}

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    price: 29,
    features: [
      'Up to 100 products',
      '1 POS terminal',
      'Basic reports',
      'Email support',
    ],
    popular: false,
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 79,
    features: [
      'Unlimited products',
      'Up to 5 POS terminals',
      'Advanced reports & analytics',
      'Priority support',
      'Loyalty program',
      'Staff management',
    ],
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 149,
    features: [
      'Everything in Professional',
      'Unlimited POS terminals',
      'Custom integrations',
      'Dedicated account manager',
      'White-label options',
      'API access',
    ],
    popular: false,
  },
];

export function SignUpPage() {
  const [step, setStep] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState('professional');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const { register, handleSubmit, watch, formState: { errors } } = useForm<SignUpFormData>();

  const password = watch('password');

  const onSubmit = async (data: SignUpFormData) => {
    if (step === 1) {
      setStep(2);
      return;
    }

    if (step === 2) {
      setStep(3);
      return;
    }

    // Final submission
    try {
      setIsSubmitting(true);

      const payload = {
        restaurantName: data.restaurantName,
        ownerName: data.ownerName,
        email: data.email,
        phone: data.phone,
        password: data.password,
        slug: data.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        restaurantPassword: data.restaurantPassword,
        plan: selectedPlan,
      };

      await api.post('/api/auth/register', payload);

      toast.success('Account created successfully! Please log in.');
      navigate('/login');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create account');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="py-6 px-6 border-b border-gray-800">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-white">
            Pay<span className="text-green-500">mint</span>
          </Link>
          <Link to="/login" className="text-gray-400 hover:text-white transition-colors">
            Already have an account? <span className="text-green-500">Log in</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 py-12 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-12">
            <div className="flex items-center gap-4">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                      step >= s
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-700 text-gray-400'
                    }`}
                  >
                    {s}
                  </div>
                  {s < 3 && (
                    <div
                      className={`w-16 h-1 mx-2 ${
                        step > s ? 'bg-green-600' : 'bg-gray-700'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Step 1: Choose Plan */}
            {step === 1 && (
              <div>
                <h1 className="text-3xl font-bold text-white text-center mb-2">
                  Choose Your Plan
                </h1>
                <p className="text-gray-400 text-center mb-8">
                  Select the plan that best fits your restaurant's needs
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {plans.map((plan) => (
                    <div
                      key={plan.id}
                      onClick={() => setSelectedPlan(plan.id)}
                      className={`relative cursor-pointer bg-gray-800 rounded-2xl p-6 border-2 transition-all ${
                        selectedPlan === plan.id
                          ? 'border-green-500 scale-105'
                          : 'border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      {plan.popular && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <span className="bg-green-500 text-black text-xs font-semibold px-3 py-1 rounded-full">
                            Most Popular
                          </span>
                        </div>
                      )}

                      <h3 className="text-xl font-semibold text-white mb-2">
                        {plan.name}
                      </h3>
                      <div className="mb-4">
                        <span className="text-4xl font-bold text-white">${plan.price}</span>
                        <span className="text-gray-400">/month</span>
                      </div>

                      <ul className="space-y-3 mb-6">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-center gap-2 text-gray-300">
                            <svg
                              className="w-5 h-5 text-green-500"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                            {feature}
                          </li>
                        ))}
                      </ul>

                      <div
                        className={`w-full py-2 rounded-lg text-center font-medium ${
                          selectedPlan === plan.id
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-700 text-gray-300'
                        }`}
                      >
                        {selectedPlan === plan.id ? 'Selected' : 'Select Plan'}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex justify-center">
                  <button
                    type="submit"
                    className="px-8 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Business Info */}
            {step === 2 && (
              <div className="max-w-xl mx-auto">
                <h1 className="text-3xl font-bold text-white text-center mb-2">
                  Restaurant Information
                </h1>
                <p className="text-gray-400 text-center mb-8">
                  Tell us about your restaurant
                </p>

                <div className="bg-gray-800 rounded-xl p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Restaurant Name *
                    </label>
                    <input
                      type="text"
                      {...register('restaurantName', { required: 'Restaurant name is required' })}
                      className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="e.g., Joe's Diner"
                    />
                    {errors.restaurantName && (
                      <p className="text-red-400 text-sm mt-1">{errors.restaurantName.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Restaurant Slug (URL) *
                    </label>
                    <div className="flex items-center">
                      <span className="px-3 py-2.5 bg-gray-600 text-gray-400 border border-r-0 border-gray-600 rounded-l-lg">
                        paymint.com/
                      </span>
                      <input
                        type="text"
                        {...register('slug', {
                          required: 'Slug is required',
                          pattern: {
                            value: /^[a-z0-9-]+$/,
                            message: 'Only lowercase letters, numbers, and hyphens allowed',
                          },
                        })}
                        className="flex-1 px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-r-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="joes-diner"
                      />
                    </div>
                    {errors.slug && (
                      <p className="text-red-400 text-sm mt-1">{errors.slug.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Restaurant Password *
                    </label>
                    <input
                      type="password"
                      {...register('restaurantPassword', {
                        required: 'Restaurant password is required',
                        minLength: { value: 4, message: 'Minimum 4 characters' },
                      })}
                      className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Password for staff to access POS"
                    />
                    <p className="text-gray-500 text-xs mt-1">
                      This is the password staff will use to access the POS system
                    </p>
                    {errors.restaurantPassword && (
                      <p className="text-red-400 text-sm mt-1">{errors.restaurantPassword.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      {...register('phone')}
                      className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                </div>

                <div className="mt-8 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-6 py-3 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="px-8 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Owner Account */}
            {step === 3 && (
              <div className="max-w-xl mx-auto">
                <h1 className="text-3xl font-bold text-white text-center mb-2">
                  Create Your Account
                </h1>
                <p className="text-gray-400 text-center mb-8">
                  Set up your owner account credentials
                </p>

                <div className="bg-gray-800 rounded-xl p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Your Full Name *
                    </label>
                    <input
                      type="text"
                      {...register('ownerName', { required: 'Name is required' })}
                      className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="John Doe"
                    />
                    {errors.ownerName && (
                      <p className="text-red-400 text-sm mt-1">{errors.ownerName.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      {...register('email', {
                        required: 'Email is required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address',
                        },
                      })}
                      className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="john@restaurant.com"
                    />
                    {errors.email && (
                      <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Password *
                    </label>
                    <input
                      type="password"
                      {...register('password', {
                        required: 'Password is required',
                        minLength: { value: 8, message: 'Minimum 8 characters' },
                      })}
                      className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Minimum 8 characters"
                    />
                    {errors.password && (
                      <p className="text-red-400 text-sm mt-1">{errors.password.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Confirm Password *
                    </label>
                    <input
                      type="password"
                      {...register('confirmPassword', {
                        required: 'Please confirm your password',
                        validate: (value) =>
                          value === password || 'Passwords do not match',
                      })}
                      className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Re-enter your password"
                    />
                    {errors.confirmPassword && (
                      <p className="text-red-400 text-sm mt-1">{errors.confirmPassword.message}</p>
                    )}
                  </div>
                </div>

                {/* Plan Summary */}
                <div className="mt-6 bg-gray-800 rounded-xl p-4 border border-gray-700">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-gray-400 text-sm">Selected Plan</p>
                      <p className="text-white font-semibold capitalize">{selectedPlan}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-400 text-sm">Monthly Price</p>
                      <p className="text-white font-semibold">
                        ${plans.find((p) => p.id === selectedPlan)?.price}/mo
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-gray-500 text-sm text-center mt-4">
                  By creating an account, you agree to our{' '}
                  <a href="#" className="text-green-500 hover:underline">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="#" className="text-green-500 hover:underline">
                    Privacy Policy
                  </a>
                </p>

                <div className="mt-6 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-6 py-3 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-8 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-600 transition-colors flex items-center gap-2"
                  >
                    {isSubmitting && (
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
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                    )}
                    Create Account
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </main>
    </div>
  );
}
