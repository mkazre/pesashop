import React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from 'react-query';
import { authAPI } from '@/services/api';
import { useAuthStore } from '@/store';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import toast from '@/utils/toast';
import pesashopLogo from '@/assets/pesashop-logo.png';

const LoginPage = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [logoError, setLogoError] = React.useState(false);

  const loginMutation = useMutation(
    (credentials) => authAPI.login(credentials),
    {
      onSuccess: (response) => {
        const { user, token } = response.data;
        setAuth(user, token);
        toast.success('Login successful');
        navigate('/');
      },
      onError: () => {
        toast.error('Invalid credentials');
      },
    }
  );

  const onSubmit = (data) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <div className="bg-white border-2 border-gray-200 p-8">
          <div className="flex justify-center mb-4">
            {logoError ? (
              <h1 className="text-3xl font-bold text-center text-primary mb-2">
                E-Commerce Admin
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
          <p className="text-center text-gray-600 mb-8">
            Sign in to your account
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Input
              label="Email"
              type="email"
              required
              fullWidth
              {...register('email', { 
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              })}
              error={errors.email?.message}
            />

            <Input
              label="Password"
              type="password"
              required
              fullWidth
              {...register('password', { 
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters'
                }
              })}
              error={errors.password?.message}
            />

            <Button
              type="submit"
              fullWidth
              loading={loginMutation.isLoading}
            >
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Test Credentials:<br />
              <strong>Email:</strong> admin@ecommerce.com<br />
              <strong>Password:</strong> Admin123!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
