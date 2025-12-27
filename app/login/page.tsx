'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Eye, EyeOff, RefreshCw } from 'lucide-react';

// Generate random CAPTCHA
const generateCaptcha = () => {
  const num1 = Math.floor(Math.random() * 10) + 1;
  const num2 = Math.floor(Math.random() * 10) + 1;
  const operators = ['+', '-', '×'];
  const operator = operators[Math.floor(Math.random() * 3)];
  
  let answer: number;
  let question: string;
  
  switch (operator) {
    case '+':
      answer = num1 + num2;
      question = `${num1} + ${num2}`;
      break;
    case '-':
      // Ensure positive result
      const larger = Math.max(num1, num2);
      const smaller = Math.min(num1, num2);
      answer = larger - smaller;
      question = `${larger} - ${smaller}`;
      break;
    case '×':
      answer = num1 * num2;
      question = `${num1} × ${num2}`;
      break;
    default:
      answer = num1 + num2;
      question = `${num1} + ${num2}`;
  }
  
  return { question, answer };
};

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // CAPTCHA state
  const [captcha, setCaptcha] = useState({ question: '', answer: 0 });
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaError, setCaptchaError] = useState('');

  // Generate CAPTCHA on mount
  useEffect(() => {
    setCaptcha(generateCaptcha());
  }, []);

  const refreshCaptcha = () => {
    setCaptcha(generateCaptcha());
    setCaptchaInput('');
    setCaptchaError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setCaptchaError('');

    // Verify CAPTCHA
    if (parseInt(captchaInput) !== captcha.answer) {
      setCaptchaError('Incorrect answer. Please try again.');
      refreshCaptcha();
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        // Store token in localStorage
        if (data.token) {
          localStorage.setItem('auth-token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
        }
        
        // Redirect based on role
        switch (data.user.role) {
          case 'admin':
            router.push('/dashboard/admin');
            break;
          case 'management':
            router.push('/dashboard/management');
            break;
          case 'accountant':
            router.push('/dashboard/accountant');
            break;
          case 'consultant':
            router.push('/dashboard/consultant');
            break;
          case 'researcher':
            router.push('/dashboard/researcher');
            break;
          case 'client':
            router.push('/dashboard/client');
            break;
          default:
            router.push('/dashboard');
        }
      } else {
        setError(data.error || 'Login failed');
        refreshCaptcha();
      }
    } catch (err) {
      setError('Network error. Please try again.');
      refreshCaptcha();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center">
            <Link href="/" className="inline-block">
              <div className="relative w-32 h-32">
                <Image
                  src="/logo.svg"
                  alt="MedConsult Liberia Logo"
                  width={128}
                  height={128}
                  className="object-contain"
                  priority
                />
              </div>
            </Link>
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link href="/register" className="font-medium text-emerald-700 hover:text-emerald-600">
              create a new account
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative mt-1">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Human Verification CAPTCHA */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Human Verification
              </label>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-gradient-to-r from-emerald-100 to-teal-100 px-4 py-3 rounded-lg">
                  <span className="text-lg font-bold text-emerald-800 select-none">
                    {captcha.question} = ?
                  </span>
                </div>
                <button
                  type="button"
                  onClick={refreshCaptcha}
                  className="p-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                  title="Get new question"
                >
                  <RefreshCw size={20} />
                </button>
              </div>
              <input
                type="number"
                required
                value={captchaInput}
                onChange={(e) => setCaptchaInput(e.target.value)}
                placeholder="Enter your answer"
                className={`mt-2 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 ${
                  captchaError ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
              />
              {captchaError && (
                <p className="mt-1 text-sm text-red-600">{captchaError}</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <Link href="/forgot-password" className="font-medium text-emerald-700 hover:text-emerald-600">
                Forgot password?
              </Link>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>

          <div className="text-center">
            <Link href="/" className="text-sm text-gray-600 hover:text-emerald-700">
              ← Back to home
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
