import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from 'react-query';
import { authAPI } from '@/services/api';
import { useAuthStore } from '@/store';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import toast from '@/utils/toast';
import pesashopLogo from '@/assets/pesashop-logo.png';

const LoginPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setAuth } = useAuthStore();
  const [logoError, setLogoError] = useState(false);
  const [mode, setMode] = useState(() => {
    // If URL has reset token, show reset form
    return searchParams.get('token') ? 'reset' : 'login';
  });

  const loginForm = useForm();
  const forgotForm = useForm();
  const resetForm = useForm();

  const loginMutation = useMutation(
    (credentials) => authAPI.login(credentials),
    {
      onSuccess: (response) => {
        const { user, token } = response.data;
        setAuth(user, token);
        toast.success('Login successful');
        navigate('/');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Invalid credentials');
      },
    }
  );

  const forgotMutation = useMutation(
    (data) => authAPI.forgotPassword(data.email),
    {
      onSuccess: (response) => {
        toast.success(response.data?.message || 'Password reset link sent to your email!');
        setMode('login');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to send reset link');
      },
    }
  );

  const resetMutation = useMutation(
    (data) => authAPI.resetPassword(searchParams.get('token'), data.password),
    {
      onSuccess: (response) => {
        toast.success(response.data?.message || 'Password reset successful!');
        setMode('login');
        navigate('/login', { replace: true });
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to reset password');
      },
    }
  );

  const Logo = () => (
    <div className="flex justify-center mb-4">
      {logoError ? (
        <h1 className="text-3xl font-bold text-center text-primary mb-2">
          PesaShop Admin
        </h1>
      ) : (
        <img 
          src={pesashopLogo} 
          alt="PESASHOP" 
          className="h-16 w-auto object-contain"
          onError={() => setLogoError(true)}
        />
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <div className="bg-white border-2 border-gray-200 p-8">
          <Logo />

          {mode === 'login' && (
            <>
              <p className="text-center text-gray-600 mb-8">
                Sign in to your account
              </p>
              <form onSubmit={loginForm.handleSubmit((data) => loginMutation.mutate(data))} className="space-y-6">
                <Input
                  label="Email"
                  type="email"
                  required
                  fullWidth
                  {...loginForm.register('email', { 
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  error={loginForm.formState.errors.email?.message}
                />
                <Input
                  label="Password"
                  type="password"
                  required
                  fullWidth
                  {...loginForm.register('password', { 
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters'
                    }
                  })}
                  error={loginForm.formState.errors.password?.message}
                />
                <Button
                  type="submit"
                  fullWidth
                  loading={loginMutation.isLoading}
                >
                  Sign In
                </Button>
              </form>
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="text-sm text-primary hover:underline font-medium"
                >
                  Forgot your password?
                </button>
              </div>
            </>
          )}

          {mode === 'forgot' && (
            <>
              <p className="text-center text-gray-600 mb-2 text-lg font-semibold">
                Forgot Password
              </p>
              <p className="text-center text-gray-500 text-sm mb-6">
                Enter your email address and we'll send you a link to reset your password.
              </p>
              <form onSubmit={forgotForm.handleSubmit((data) => forgotMutation.mutate(data))} className="space-y-6">
                <Input
                  label="Email"
                  type="email"
                  required
                  fullWidth
                  {...forgotForm.register('email', { 
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  error={forgotForm.formState.errors.email?.message}
                />
                <Button
                  type="submit"
                  fullWidth
                  loading={forgotMutation.isLoading}
                >
                  Send Reset Link
                </Button>
              </form>
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-sm text-primary hover:underline font-medium"
                >
                  Back to Sign In
                </button>
              </div>
            </>
          )}

          {mode === 'reset' && (
            <>
              <p className="text-center text-gray-600 mb-2 text-lg font-semibold">
                Reset Password
              </p>
              <p className="text-center text-gray-500 text-sm mb-6">
                Enter your new password below.
              </p>
              <form onSubmit={resetForm.handleSubmit((data) => resetMutation.mutate(data))} className="space-y-6">
                <Input
                  label="New Password"
                  type="password"
                  required
                  fullWidth
                  {...resetForm.register('password', { 
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters'
                    }
                  })}
                  error={resetForm.formState.errors.password?.message}
                />
                <Input
                  label="Confirm Password"
                  type="password"
                  required
                  fullWidth
                  {...resetForm.register('confirmPassword', { 
                    required: 'Please confirm your password',
                    validate: (value) => value === resetForm.watch('password') || 'Passwords do not match'
                  })}
                  error={resetForm.formState.errors.confirmPassword?.message}
                />
                <Button
                  type="submit"
                  fullWidth
                  loading={resetMutation.isLoading}
                >
                  Reset Password
                </Button>
              </form>
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => { setMode('login'); navigate('/login', { replace: true }); }}
                  className="text-sm text-primary hover:underline font-medium"
                >
                  Back to Sign In
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
