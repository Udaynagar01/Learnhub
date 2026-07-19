import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Loader2, Mail, MapPin, MessageSquare, Phone } from 'lucide-react';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const initialForm = {
  name: '',
  email: '',
  subject: '',
  message: '',
};

export default function Contact() {
  const { user } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    setForm((prev) => ({
      ...prev,
      name: prev.name || user.name || '',
      email: prev.email || user.email || '',
    }));
  }, [user]);

  const updateField = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (status?.type === 'error') setStatus(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setStatus(null);

    try {
      const { data } = await api.post('/contact', form);
      setStatus({
        type: 'success',
        message: data.message || 'Thanks! Your message has been sent.',
      });
      setForm({
        name: user?.name || '',
        email: user?.email || '',
        subject: '',
        message: '',
      });
    } catch (err) {
      setStatus({
        type: 'error',
        message: err.response?.data?.message || 'Could not send your message. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="max-w-3xl"
      >
        <h1 className="font-display text-4xl font-bold text-slate-900 dark:text-white">Contact LearnHub</h1>
        <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">
          Need help with courses, certificates, payments, or instructor access? Send a message and the LearnHub team will get back to you.
        </p>
      </motion.div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_380px]">
        <motion.form
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.08 }}
          onSubmit={handleSubmit}
          className="hover-glow rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
        >
          {status && (
            <div
              className={`mb-5 flex items-start gap-3 rounded-xl border p-4 text-sm ${
                status.type === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300'
                  : 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300'
              }`}
            >
              {status.type === 'success' ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none" />
              ) : (
                <AlertCircle className="mt-0.5 h-4 w-4 flex-none" />
              )}
              <p>{status.message}</p>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Name</label>
              <input
                value={form.name}
                onChange={updateField('name')}
                className="input-field mt-1"
                placeholder="Your name"
                autoComplete="name"
                required
                minLength={2}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={updateField('email')}
                className="input-field mt-1"
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Subject</label>
            <input
              value={form.subject}
              onChange={updateField('subject')}
              className="input-field mt-1"
              placeholder="How can we help?"
              required
              minLength={3}
            />
          </div>
          <div className="mt-4">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Message</label>
            <textarea
              value={form.message}
              onChange={updateField('message')}
              className="input-field mt-1 min-h-[140px] resize-y"
              placeholder="Write your message..."
              required
              minLength={10}
            />
          </div>
          <Button type="submit" className="mt-5" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              'Send message'
            )}
          </Button>
        </motion.form>

        <aside className="space-y-4">
          {[
            { icon: Mail, label: 'Email', value: 'support@learnhub.com' },
            { icon: Phone, label: 'Phone', value: '+91 7000425725' },
            { icon: MapPin, label: 'Location', value: 'India' },
            { icon: MessageSquare, label: 'Support', value: 'Dashboard messages' },
          ].map(({ icon: Icon, label, value }, index) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, x: 14 }}
              animate={{ opacity: 1, x: 0 }}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.3, delay: 0.12 + index * 0.04 }}
              className="hover-glow rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
            >
              <Icon className="h-5 w-5 text-primary-500" />
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{label}</p>
              <p className="font-semibold text-slate-900 dark:text-white">{value}</p>
            </motion.div>
          ))}
        </aside>
      </div>
    </div>
  );
}
