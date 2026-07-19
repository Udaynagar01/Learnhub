import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Check, X } from 'lucide-react';

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

export default function ResetPassword() {
  const [params] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const token = params.get('token') || '';

  const submit = async (e) => {
    e.preventDefault();
    setMessage('');
    const errors = {};
    const passwordError = validatePassword(password);
    if (passwordError) errors.password = passwordError;
    if (!confirmPassword) errors.confirmPassword = 'Please confirm your password';
    else if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match';
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      setMessage('Password reset successful. Redirecting to login...');
      setTimeout(() => navigate('/login'), 900);
    } catch (err) {
      applyApiFieldErrors(err.response?.data?.errors, setFieldErrors);
      setMessage(getApiErrorMessage(err, 'Could not reset password'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <GlassCard className="w-full max-w-md p-8">
        <h1 className="font-display text-2xl font-bold text-slate-900">Create new password</h1>
        <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
          <div>
            <label htmlFor="reset-password" className="text-sm font-medium text-slate-700">
              New password
            </label>
            <div className="relative mt-1">
              <input
                id="reset-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setFieldErrors((prev) => {
                    const next = { ...prev };
                    delete next.password;
                    return next;
                  });
                }}
                className={`${authInputClass(fieldErrors.password)} pr-10`}
                disabled={!token}
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
            <PasswordChecklist password={password} />
          </div>
          <div>
            <label htmlFor="reset-confirm" className="text-sm font-medium text-slate-700">
              Confirm password
            </label>
            <input
              id="reset-confirm"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setFieldErrors((prev) => {
                  const next = { ...prev };
                  delete next.confirmPassword;
                  return next;
                });
              }}
              className={authInputClass(fieldErrors.confirmPassword)}
              disabled={!token}
            />
            <AuthFieldError message={fieldErrors.confirmPassword} />
          </div>
          <Button type="submit" className="w-full" disabled={loading || !token}>
            {loading ? 'Saving...' : 'Reset password'}
          </Button>
        </form>
        {!token && <p className="mt-4 text-sm text-red-600">Reset token is missing.</p>}
        {message && <p className="mt-4 text-sm text-slate-600">{message}</p>}
        <Link to="/forgot-password" className="mt-6 block text-center text-sm font-semibold text-primary-600 hover:underline">
          Generate a new link
        </Link>
      </GlassCard>
    </div>
  );
}
