import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GraduationCap, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import GoogleSignInButton from '../components/GoogleSignInButton';
import GlassCard from '../components/ui/GlassCard';
import { AuthFieldError, authInputClass } from '../components/auth/AuthField';
import {
  applyApiFieldErrors,
  getApiErrorMessage,
  validateEmail,
  validateLogin,
  validateLoginPassword,
} from '../utils/authValidation';
import { getAuthRedirectPath } from '../utils/authRedirect';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const clearFieldError = (field) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const result = validateLogin({ email, password });
    setFieldErrors(result.errors);
    if (!result.valid) return;

    setLoading(true);
    try {
      const user = await login(result.values.email, result.values.password);
      navigate(getAuthRedirectPath(user));
    } catch (err) {
      applyApiFieldErrors(err.response?.data?.errors, setFieldErrors);
      setError(getApiErrorMessage(err, 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleCredential = async (credential) => {
    setError('');
    setFieldErrors({});
    setLoading(true);
    try {
      const user = await loginWithGoogle(credential);
      navigate(getAuthRedirectPath(user));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Google login failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-500">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-bold text-slate-900">Welcome back</h1>
          <p className="mt-1 text-slate-500">Sign in to continue learning on LearnHub</p>
        </div>
        <GlassCard className="p-8">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</p>}
            <div>
              <label htmlFor="login-email" className="text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearFieldError('email');
                }}
                onBlur={() => {
                  const msg = validateEmail(email);
                  if (msg) setFieldErrors((prev) => ({ ...prev, email: msg }));
                }}
                className={authInputClass(fieldErrors.email)}
              />
              <AuthFieldError message={fieldErrors.email} />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="login-password" className="text-sm font-medium text-slate-700">
                  Password
                </label>
                <Link to="/forgot-password" className="text-xs font-semibold text-primary-600 hover:underline">
                  Forgot?
                </Link>
              </div>
              <div className="relative mt-1">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    clearFieldError('password');
                  }}
                  onBlur={() => {
                    const msg = validateLoginPassword(password);
                    if (msg) setFieldErrors((prev) => ({ ...prev, password: msg }));
                  }}
                  className={`${authInputClass(fieldErrors.password)} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <AuthFieldError message={fieldErrors.password} />
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
            <GoogleSignInButton onCredential={handleGoogleCredential} onError={setError} />
          </form>
          <p className="mt-6 text-center text-sm text-slate-500">
            No account?{' '}
            <Link to="/register" className="font-semibold text-primary-600 hover:underline">
              Sign up free
            </Link>
          </p>
        </GlassCard>
      </motion.div>
    </div>
  );
}
