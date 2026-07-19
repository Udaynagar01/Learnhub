import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GraduationCap, Eye, EyeOff, Check, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import GoogleSignInButton from '../components/GoogleSignInButton';
import GlassCard from '../components/ui/GlassCard';
import { AuthFieldError, authInputClass } from '../components/auth/AuthField';
import {
  applyApiFieldErrors,
  getApiErrorMessage,
  getPasswordChecks,
  validateEmail,
  validateName,
  validatePassword,
  validateRegister,
} from '../utils/authValidation';
import { getAuthRedirectPath } from '../utils/authRedirect';

function PasswordChecklist({ password }) {
  const checks = getPasswordChecks(password);
  const items = [
    { key: 'length', label: '8–72 characters', ok: checks.length },
    { key: 'upper', label: 'One uppercase letter', ok: checks.upper },
    { key: 'lower', label: 'One lowercase letter', ok: checks.lower },
    { key: 'number', label: 'One number', ok: checks.number },
  ];

  if (!password) return null;

  return (
    <ul className="mt-2 space-y-1">
      {items.map((item) => (
        <li key={item.key} className={`flex items-center gap-2 text-xs ${item.ok ? 'text-green-600' : 'text-slate-500'}`}>
          {item.ok ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
          {item.label}
        </li>
      ))}
    </ul>
  );
}

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
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
    const result = validateRegister(form);
    setFieldErrors(result.errors);
    if (!result.valid) return;

    setLoading(true);
    try {
      const user = await register(result.values);
      navigate(getAuthRedirectPath(user));
    } catch (err) {
      applyApiFieldErrors(err.response?.data?.errors, setFieldErrors);
      setError(getApiErrorMessage(err, 'Registration failed'));
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
      setError(getApiErrorMessage(err, 'Google sign-up failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-500">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-bold text-slate-900">Create account</h1>
          <p className="mt-1 text-slate-500">Join LearnHub and start learning today</p>
        </div>
        <GlassCard className="p-8">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</p>}
            <div>
              <label htmlFor="register-name" className="text-sm font-medium text-slate-700">
                Full Name
              </label>
              <input
                id="register-name"
                autoComplete="name"
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                onBlur={() => {
                  const msg = validateName(form.name);
                  if (msg) setFieldErrors((prev) => ({ ...prev, name: msg }));
                }}
                className={authInputClass(fieldErrors.name)}
              />
              <AuthFieldError message={fieldErrors.name} />
            </div>
            <div>
              <label htmlFor="register-email" className="text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                id="register-email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                onBlur={() => {
                  const msg = validateEmail(form.email);
                  if (msg) setFieldErrors((prev) => ({ ...prev, email: msg }));
                }}
                className={authInputClass(fieldErrors.email)}
              />
              <AuthFieldError message={fieldErrors.email} />
            </div>
            <div>
              <label htmlFor="register-password" className="text-sm font-medium text-slate-700">
                Password
              </label>
              <div className="relative mt-1">
                <input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  onBlur={() => {
                    const msg = validatePassword(form.password);
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
              <PasswordChecklist password={form.password} />
            </div>
            <div>
              <label htmlFor="register-confirm" className="text-sm font-medium text-slate-700">
                Confirm Password
              </label>
              <div className="relative mt-1">
                <input
                  id="register-confirm"
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={form.confirmPassword}
                  onChange={(e) => updateField('confirmPassword', e.target.value)}
                  onBlur={() => {
                    if (!form.confirmPassword) {
                      setFieldErrors((prev) => ({ ...prev, confirmPassword: 'Please confirm your password' }));
                    } else if (form.password !== form.confirmPassword) {
                      setFieldErrors((prev) => ({ ...prev, confirmPassword: 'Passwords do not match' }));
                    }
                  }}
                  className={`${authInputClass(fieldErrors.confirmPassword)} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <AuthFieldError message={fieldErrors.confirmPassword} />
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? 'Creating...' : 'Sign Up Free'}
            </Button>
            <GoogleSignInButton onCredential={handleGoogleCredential} onError={setError} text="signup_with" />
          </form>
          <p className="mt-6 text-center text-sm text-slate-500">
            Have an account?{' '}
            <Link to="/login" className="font-semibold text-primary-600 hover:underline">
              Sign in
            </Link>
          </p>
        </GlassCard>
      </motion.div>
    </div>
  );
}
