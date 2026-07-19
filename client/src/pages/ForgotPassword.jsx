import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Button from '../components/Button';
import GlassCard from '../components/ui/GlassCard';
import { AuthFieldError, authInputClass } from '../components/auth/AuthField';
import { applyApiFieldErrors, getApiErrorMessage, validateEmail } from '../utils/authValidation';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [message, setMessage] = useState('');
  const [resetUrl, setResetUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setMessage('');
    setResetUrl('');
    const emailError = validateEmail(email);
    if (emailError) {
      setFieldErrors({ email: emailError });
      return;
    }

    setLoading(true);
    try {
      const normalized = email.trim().toLowerCase();
      const { data } = await api.post('/auth/forgot-password', { email: normalized });
      setMessage(data.data?.emailSent ? 'Reset link sent to your email.' : data.message);
      setResetUrl(data.data?.resetUrl || '');
      setFieldErrors({});
    } catch (err) {
      applyApiFieldErrors(err.response?.data?.errors, setFieldErrors);
      setMessage(getApiErrorMessage(err, 'Could not generate reset link'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <GlassCard className="w-full max-w-md p-8">
        <h1 className="font-display text-2xl font-bold text-slate-900">Reset password</h1>
        <p className="mt-1 text-sm text-slate-500">Enter your account email to generate a reset link.</p>
        <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
          <div>
            <label htmlFor="forgot-email" className="text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="forgot-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setFieldErrors({});
              }}
              onBlur={() => {
                const msg = validateEmail(email);
                if (msg) setFieldErrors({ email: msg });
              }}
              className={authInputClass(fieldErrors.email)}
            />
            <AuthFieldError message={fieldErrors.email} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Generating...' : 'Generate reset link'}
          </Button>
        </form>
        {message && <p className="mt-4 text-sm text-slate-600">{message}</p>}
        {resetUrl && (
          <a href={resetUrl} className="mt-3 block break-all text-sm font-medium text-primary-600 hover:underline">
            Open dev reset link
          </a>
        )}
        <Link to="/login" className="mt-6 block text-center text-sm font-semibold text-primary-600 hover:underline">
          Back to login
        </Link>
      </GlassCard>
    </div>
  );
}
