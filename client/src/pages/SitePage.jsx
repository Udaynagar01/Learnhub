import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText, Loader2 } from 'lucide-react';
import api from '../services/api';
import PageContent from '../components/PageContent';

const SLUG_LABELS = {
  'help-center': 'Help Center',
  'terms-of-service': 'Terms of Service',
  'privacy-policy': 'Privacy Policy',
};

export default function SitePage() {
  const { pathname } = useLocation();
  const slug = pathname.replace(/^\//, '');
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    api
      .get(`/pages/${slug}`)
      .then((res) => setPage(res.data.data))
      .catch(() => setError('This page could not be loaded.'))
      .finally(() => setLoading(false));
  }, [slug]);

  const fallbackTitle = SLUG_LABELS[slug] || 'Page';

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-primary-600 dark:text-slate-400"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to home
      </Link>

      {loading ? (
        <div className="mt-16 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        </div>
      ) : error ? (
        <div className="mt-10 rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </div>
      ) : (
        <motion.article
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mt-8"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-500 text-white">
            <FileText className="h-6 w-6" />
          </div>
          <h1 className="mt-5 font-display text-4xl font-bold text-slate-900 dark:text-white">
            {page?.title || fallbackTitle}
          </h1>
          {page?.updatedAt && (
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Last updated {new Date(page.updatedAt).toLocaleDateString('en-IN', { dateStyle: 'long' })}
            </p>
          )}
          <div className="mt-8">
            <PageContent content={page?.content || ''} />
          </div>
        </motion.article>
      )}
    </div>
  );
}
