import { useState, useEffect, useRef, useCallback } from 'react';
import { IoClose } from 'react-icons/io5';
import { useUIStore, useAuthStore } from '@/store';
import { useForm } from 'react-hook-form';
import { authAPI, menusAPI } from '@/services/api';
import Button from '../common/Button';
import Input from '../common/Input';
import toast from 'react-hot-toast';
import pesaLogo from '@/assets/pesashop-logo.png';

// Load Google Identity Services script
function loadGoogleScript(clientId) {
  return new Promise((resolve) => {
    if (window.google?.accounts?.id) { resolve(); return; }
    if (document.getElementById('google-gsi-script')) { 
      const check = setInterval(() => { if (window.google?.accounts?.id) { clearInterval(check); resolve(); } }, 100);
      setTimeout(() => { clearInterval(check); resolve(); }, 5000);
      return;
    }
    const script = document.createElement('script');
    script.id = 'google-gsi-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      const check = setInterval(() => { if (window.google?.accounts?.id) { clearInterval(check); resolve(); } }, 100);
      setTimeout(() => { clearInterval(check); resolve(); }, 5000);
    };
    script.onerror = () => resolve();
    document.head.appendChild(script);
  });
}

// Load Facebook SDK
function loadFacebookScript(appId) {
  return new Promise((resolve) => {
    if (window.FB) { resolve(); return; }
    window.fbAsyncInit = function() {
      window.FB.init({ appId, cookie: true, xfbml: false, version: 'v18.0' });
      resolve();
    };
    if (document.getElementById('facebook-jssdk')) { resolve(); return; }
    const script = document.createElement('script');
    script.id = 'facebook-jssdk';
    script.src = 'https://connect.facebook.net/en_US/sdk.js';
    script.async = true;
    script.defer = true;
    script.onerror = () => resolve();
    document.head.appendChild(script);
  });
}

export default function AuthModal() {
  const { authModalOpen, authModalMode, closeAuthModal, setAuthModalMode } = useUIStore();
  const { setAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [socialConfig, setSocialConfig] = useState(null);
  const [socialLoading, setSocialLoading] = useState(false);
  const [logoSrc, setLogoSrc] = useState('');
  const googleInitialized = useRef(false);

  // Fetch social login config and logo when modal opens
  useEffect(() => {
    if (!authModalOpen) return;
    let cancelled = false;
    authAPI.getSocialLoginConfig().then(res => {
      if (!cancelled) setSocialConfig(res.data?.data || null);
    }).catch(() => {
      if (!cancelled) setSocialConfig(null);
    });
    // Fetch header menu to get logo
    menusAPI.getByLocation('header').then(res => {
      if (!cancelled) {
        const settings = res.data?.data?.settings || {};
        const src = settings?.logo?.src || '';
        if (src) setLogoSrc(src);
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [authModalOpen]);

  // Load SDKs when config is available
  useEffect(() => {
    if (!socialConfig || !authModalOpen) return;
    if (socialConfig.google?.enabled && socialConfig.google?.clientId) {
      loadGoogleScript(socialConfig.google.clientId);
    }
    if (socialConfig.facebook?.enabled && socialConfig.facebook?.appId) {
      loadFacebookScript(socialConfig.facebook.appId);
    }
  }, [socialConfig, authModalOpen]);

  const handleGoogleLogin = useCallback(async () => {
    if (!socialConfig?.google?.enabled) {
      toast.error('Google login is not configured. Please contact the store administrator.');
      return;
    }
    setSocialLoading(true);
    try {
      await loadGoogleScript(socialConfig.google.clientId);
      if (!window.google?.accounts?.id) {
        toast.error('Failed to load Google Sign-In. Please try again.');
        setSocialLoading(false);
        return;
      }
      // Use the one-tap / popup approach
      window.google.accounts.id.initialize({
        client_id: socialConfig.google.clientId,
        callback: async (response) => {
          try {
            const res = await authAPI.googleLogin(response.credential);
            setAuth(res.data.user, res.data.token);
            toast.success('Logged in with Google!');
            closeAuthModal();
          } catch (error) {
            toast.error(error.response?.data?.message || 'Google login failed');
          } finally {
            setSocialLoading(false);
          }
        },
        auto_select: false,
      });
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // Fallback: use renderButton approach in a temporary container
          const container = document.createElement('div');
          container.style.position = 'fixed';
          container.style.top = '-9999px';
          document.body.appendChild(container);
          window.google.accounts.id.renderButton(container, { type: 'standard', size: 'large' });
          const btn = container.querySelector('[role="button"]') || container.querySelector('div[id^="g_"]');
          if (btn) btn.click();
          setTimeout(() => { document.body.removeChild(container); setSocialLoading(false); }, 1000);
        }
      });
    } catch (error) {
      toast.error('Google login failed. Please try again.');
      setSocialLoading(false);
    }
  }, [socialConfig, setAuth, closeAuthModal]);

  const handleFacebookLogin = useCallback(async () => {
    if (!socialConfig?.facebook?.enabled) {
      toast.error('Facebook login is not configured. Please contact the store administrator.');
      return;
    }
    setSocialLoading(true);
    try {
      await loadFacebookScript(socialConfig.facebook.appId);
      if (!window.FB) {
        toast.error('Failed to load Facebook SDK. Please try again.');
        setSocialLoading(false);
        return;
      }
      window.FB.login((response) => {
        if (response.authResponse) {
          const accessToken = response.authResponse.accessToken;
          authAPI.facebookLogin(accessToken).then(res => {
            setAuth(res.data.user, res.data.token);
            toast.success('Logged in with Facebook!');
            closeAuthModal();
          }).catch(error => {
            toast.error(error.response?.data?.message || 'Facebook login failed');
          }).finally(() => {
            setSocialLoading(false);
          });
        } else {
          setSocialLoading(false);
        }
      }, { scope: 'email,public_profile' });
    } catch (error) {
      toast.error('Facebook login failed. Please try again.');
      setSocialLoading(false);
    }
  }, [socialConfig, setAuth, closeAuthModal]);

  if (!authModalOpen) return null;

  const showSocialLogin = socialConfig && (socialConfig.google?.enabled || socialConfig.facebook?.enabled);

  const LoginForm = () => {
    const { register, handleSubmit, formState: { errors } } = useForm();

    const onSubmit = async (data) => {
      setIsLoading(true);
      try {
        const response = await authAPI.login(data);
        setAuth(response.data.user, response.data.token);
        toast.success('Logged in successfully!');
        closeAuthModal();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Login failed');
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email*"
          type="email"
          {...register('email', { required: 'Email is required' })}
          error={errors.email?.message}
        />
        <Input
          label="Password*"
          type="password"
          {...register('password', { required: 'Password is required' })}
          error={errors.password?.message}
        />

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="w-4 h-4" />
            <span>Remember me</span>
          </label>
          <button
            type="button"
            onClick={() => setAuthModalMode('forgot')}
            className="text-primary hover:underline"
          >
            Forget Your Password?
          </button>
        </div>

        <Button
          type="submit"
          variant="primary-filled"
          fullWidth
          loading={isLoading}
        >
          Sign In
        </Button>

        <p className="text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <button
            type="button"
            onClick={() => setAuthModalMode('register')}
            className="text-primary hover:underline font-medium"
          >
            Create Account
          </button>
        </p>
      </form>
    );
  };

  const RegisterForm = () => {
    const { register, handleSubmit, watch, formState: { errors } } = useForm();

    const onSubmit = async (data) => {
      setIsLoading(true);
      try {
        const response = await authAPI.register(data);
        setAuth(response.data.user, response.data.token);
        toast.success('Account created successfully!');
        closeAuthModal();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Registration failed');
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="First Name*"
            {...register('firstName', { required: 'First name is required' })}
            error={errors.firstName?.message}
          />
          <Input
            label="Last Name*"
            {...register('lastName', { required: 'Last name is required' })}
            error={errors.lastName?.message}
          />
        </div>

        <Input
          label="Email*"
          type="email"
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
          label="Password*"
          type="password"
          {...register('password', { 
            required: 'Password is required',
            minLength: {
              value: 8,
              message: 'Password must be at least 8 characters'
            }
          })}
          error={errors.password?.message}
        />

        <Input
          label="Confirm Password*"
          type="password"
          {...register('confirmPassword', { 
            required: 'Please confirm your password',
            validate: value => value === watch('password') || 'Passwords do not match'
          })}
          error={errors.confirmPassword?.message}
        />

        <Button
          type="submit"
          variant="primary-filled"
          fullWidth
          loading={isLoading}
        >
          Create Account
        </Button>

        <p className="text-center text-sm text-gray-600">
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => setAuthModalMode('login')}
            className="text-primary hover:underline font-medium"
          >
            Sign in
          </button>
        </p>
      </form>
    );
  };

  const ForgotPasswordForm = () => {
    const { register, handleSubmit, formState: { errors } } = useForm();

    const onSubmit = async (data) => {
      setIsLoading(true);
      try {
        await authAPI.forgotPassword(data.email);
        toast.success('Password reset link sent to your email!');
        setAuthModalMode('login');
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to send reset link');
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email*"
          type="email"
          {...register('email', { required: 'Email is required' })}
          error={errors.email?.message}
        />

        <Button
          type="submit"
          variant="primary-filled"
          fullWidth
          loading={isLoading}
        >
          Reset Password
        </Button>

        <p className="text-center text-sm text-gray-600">
          <button
            type="button"
            onClick={() => setAuthModalMode('login')}
            className="text-primary hover:underline font-medium"
          >
            Back to Sign in
          </button>
        </p>
      </form>
    );
  };

  const ResetPasswordForm = () => {
    const { register, handleSubmit, watch, formState: { errors } } = useForm();

    const onSubmit = async (data) => {
      setIsLoading(true);
      try {
        // Extract token from URL
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        
        await authAPI.resetPassword(token, data.password);
        toast.success('Password reset successful!');
        setAuthModalMode('login');
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to reset password');
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="New Password*"
          type="password"
          {...register('password', { 
            required: 'Password is required',
            minLength: {
              value: 8,
              message: 'Password must be at least 8 characters'
            }
          })}
          error={errors.password?.message}
        />

        <Input
          label="Confirm Password*"
          type="password"
          {...register('confirmPassword', { 
            required: 'Please confirm your password',
            validate: value => value === watch('password') || 'Passwords do not match'
          })}
          error={errors.confirmPassword?.message}
        />

        <Button
          type="submit"
          variant="primary-filled"
          fullWidth
          loading={isLoading}
        >
          Change Password
        </Button>
      </form>
    );
  };

  const modes = {
    login: {
      title: 'Log in',
      component: LoginForm,
      icon: '💡'
    },
    register: {
      title: 'Create Account',
      component: RegisterForm,
      icon: '👤'
    },
    forgot: {
      title: 'Forgot Password',
      component: ForgotPasswordForm,
      icon: '🔒'
    },
    reset: {
      title: 'Create New Password',
      component: ResetPasswordForm,
      icon: '✓'
    }
  };

  const currentMode = modes[authModalMode];
  const FormComponent = currentMode.component;

  return (
    <div className="modal-overlay" onClick={closeAuthModal}>
      <div 
        className="modal-content max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative bg-white p-8">
          {/* Close Button */}
          <button
            onClick={closeAuthModal}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            <IoClose size={24} />
          </button>

          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img src={logoSrc || pesaLogo} alt="PesaShop" className="h-14 w-auto object-contain" />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-center mb-6">{currentMode.title}</h2>

          {/* Social Login */}
          {(authModalMode === 'login' || authModalMode === 'register') && showSocialLogin && (
            <div className="space-y-3 mb-6">
              {socialConfig?.google?.enabled && (
                <button
                  onClick={handleGoogleLogin}
                  disabled={socialLoading}
                  className="w-full flex items-center justify-center gap-3 px-6 py-3 border-2 border-gray-300 hover:border-gray-400 transition-colors disabled:opacity-50"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span>{socialLoading ? 'Connecting...' : 'Continue with Google'}</span>
                </button>
              )}
              {socialConfig?.facebook?.enabled && (
                <button
                  onClick={handleFacebookLogin}
                  disabled={socialLoading}
                  className="w-full flex items-center justify-center gap-3 px-6 py-3 border-2 border-gray-300 hover:border-gray-400 transition-colors disabled:opacity-50"
                >
                  <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <span>{socialLoading ? 'Connecting...' : 'Continue with Facebook'}</span>
                </button>
              )}
            </div>
          )}

          {/* Divider */}
          {(authModalMode === 'login' || authModalMode === 'register') && showSocialLogin && (
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">Or continue with email</span>
              </div>
            </div>
          )}

          {/* Form */}
          <FormComponent />
        </div>
      </div>
    </div>
  );
}
