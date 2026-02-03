import React, { useState, useCallback, useEffect } from 'react';
import { getConfig, loginWithPassword, signupWithPassword } from 'modelence/client';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import Page from '@/client/components/Page';
import { Button } from '@/client/components/ui/Button';
import { Input } from '@/client/components/ui/Input';
import { Label } from '@/client/components/ui/Label';

export default function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Determine initial state based on route
  const isSignup = location.pathname === '/signup';
  const [isLogin, setIsLogin] = useState(!isSignup);

  // Update state when route changes
  useEffect(() => {
    setIsLogin(location.pathname !== '/signup');
  }, [location.pathname]);

  return (
    <Page className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="flex flex-col lg:flex-row">
            {/* Left Side - Branding */}
            <div className="lg:w-1/2 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-8 lg:p-12 flex flex-col justify-between relative overflow-hidden">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <defs>
                    <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                      <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5"/>
                    </pattern>
                  </defs>
                  <rect width="100" height="100" fill="url(#grid)" />
                </svg>
              </div>

              {/* Decorative Circles */}
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-purple-400/20 rounded-full blur-3xl"></div>

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="text-2xl font-bold text-white">TripWise</span>
                </div>

                <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
                  {isLogin ? 'Welcome Back!' : 'Join the Adventure'}
                </h1>
                <p className="text-lg text-white/80 mb-8">
                  {isLogin 
                    ? 'Sign in to continue planning your next unforgettable journey.'
                    : 'Create your account and start planning personalized trips today.'}
                </p>

                {/* Features */}
                <div className="space-y-4">
                  {[
                    { icon: '🗺️', text: 'Smart personalized itineraries' },
                    { icon: '🌤️', text: 'Weather-adaptive planning' },
                    { icon: '📍', text: 'Interactive maps & directions' },
                  ].map((feature, i) => (
                    <div key={i} className="flex items-center gap-3 text-white/90">
                      <span className="text-xl">{feature.icon}</span>
                      <span>{feature.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative z-10 mt-8 lg:mt-0">
                <p className="text-white/60 text-sm">
                  © 2024 TripWise. All rights reserved.
                </p>
              </div>
            </div>

            {/* Right Side - Form */}
            <div className="lg:w-1/2 p-8 lg:p-12 flex items-center">
              <div className="w-full max-w-md mx-auto">
                {isLogin ? <LoginForm onToggle={() => navigate('/signup')} /> : <SignupForm onToggle={() => navigate('/login')} />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Page>
  );
}

function LoginForm({ onToggle }: { onToggle: () => void }) {
  const navigate = useNavigate();

  const handleSubmit = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    
    try {
      await loginWithPassword({ email, password });
      toast.success('Welcome back!');
      navigate('/');
    } catch (error) {
      toast.error((error as Error).message || 'Login failed');
    }
  }, [navigate]);

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Sign in to your account</h2>
        <p className="text-gray-500 mt-1">Enter your credentials to access your trips</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium text-gray-700">
          Email Address
        </Label>
        <Input 
          type="email" 
          name="email" 
          id="email"
          placeholder="you@example.com"
          defaultValue={getConfig('example.modelenceDemoUsername') as string | undefined}
          required
          className="h-11"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password" className="text-sm font-medium text-gray-700">
            Password
          </Label>
        </div>
        <Input 
          type="password" 
          name="password" 
          id="password"
          placeholder="••••••••"
          defaultValue={getConfig('example.modelenceDemoPassword') as string | undefined}
          required
          className="h-11"
        />
      </div>

      <Button
        className="w-full h-11 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
        type="submit"
      >
        Sign In
      </Button>

      <p className="text-center text-sm text-gray-600">
        Don't have an account?{' '}
        <button
          type="button"
          onClick={onToggle}
          className="text-blue-600 font-medium cursor-pointer hover:underline"
        >
          Sign up
        </button>
      </p>
    </form>
  );
}

function SignupForm({ onToggle }: { onToggle: () => void }) {
  const navigate = useNavigate();
  const [isSignupSuccess, setIsSignupSuccess] = useState(false);

  const handleSubmit = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    const email = String(formData.get('email'));
    const password = String(formData.get('password'));
    const confirmPassword = String(formData.get('confirmPassword'));
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    
    try {
      await signupWithPassword({ email, password });
      setIsSignupSuccess(true);
      toast.success('Account created successfully!');
    } catch (error) {
      toast.error((error as Error).message || 'Signup failed');
    }
  }, []);

  if (isSignupSuccess) {
    return (
      <div className="text-center py-8">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Created!</h2>
        <p className="text-gray-500 mb-6">Your account has been created successfully.</p>
        <Button
          onClick={() => navigate('/')}
          className="w-full h-11 text-base font-semibold shadow-lg"
        >
          Get Started
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Create an account</h2>
        <p className="text-gray-500 mt-1">Start planning your adventures today</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium text-gray-700">
          Email Address
        </Label>
        <Input 
          type="email" 
          name="email" 
          id="email"
          placeholder="you@example.com"
          required
          className="h-11"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm font-medium text-gray-700">
          Password
        </Label>
        <Input 
          type="password" 
          name="password" 
          id="password"
          placeholder="••••••••"
          required
          minLength={8}
          className="h-11"
        />
        <p className="text-xs text-gray-500">Must be at least 8 characters</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
          Confirm Password
        </Label>
        <Input 
          type="password" 
          name="confirmPassword" 
          id="confirmPassword"
          placeholder="••••••••"
          required
          className="h-11"
        />
      </div>

      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            id="consent-terms"
            type="checkbox"
            name="consent-terms"
            className="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div className="ml-3 text-sm">
          <Label htmlFor="consent-terms" className="text-gray-600">
            I accept the <a className="font-medium text-blue-600 hover:underline" href="/terms" target="_blank">Terms and Conditions</a>
          </Label>
        </div>
      </div>

      <Button
        className="w-full h-11 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
        type="submit"
      >
        Create Account
      </Button>

      <p className="text-center text-sm text-gray-600">
        Already have an account?{' '}
        <button
          type="button"
          onClick={onToggle}
          className="text-blue-600 font-medium cursor-pointer hover:underline"
        >
          Sign in
        </button>
      </p>
    </form>
  );
}
