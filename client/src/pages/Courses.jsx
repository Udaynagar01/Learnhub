import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../services/api';
import CourseCard from '../components/CourseCard';

const SORT_OPTIONS = [
  { value: 'popular', label: 'Most Popular' },
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
];

const PRICE_FILTERS = [
  { value: '', label: 'All Prices' },
  { value: 'free', label: 'Free' },
  { value: 'paid', label: 'Paid' },
];

const RATING_FILTERS = [
  { value: '', label: 'All Ratings' },
  { value: '4', label: '4+ Stars' },
  { value: '3', label: '3+ Stars' },
];

const PAGE_SIZE = 12;

function getPageNumbers(current, total) {
  if (total <= 1) return total === 1 ? [1] : [];
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages = new Set([1, total, current, current - 1, current + 1]);
  return [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
}

export default function Courses() {
  const [params, setParams] = useSearchParams();
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  const q = params.get('q') || '';
  const category = params.get('category') || '';
  const price = params.get('price') || '';
  const rating = params.get('rating') || '';
  const sort = params.get('sort') || 'popular';
  const page = Math.max(1, Number(params.get('page') || 1));

  useEffect(() => {
    api.get('/categories').then((r) => setCategories(r.data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const query = new URLSearchParams();
    if (q) query.set('q', q);
    if (category) query.set('category', category);
    if (price) query.set('price', price);
    if (rating) query.set('minRating', rating);
    if (sort) query.set('sort', sort);
    query.set('page', String(page));
    query.set('limit', String(PAGE_SIZE));

    api
      .get(`/courses?${query}`)
      .then((r) => {
        const data = r.data.data || {};
        setCourses(data.courses || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 0);
      })
      .catch(() => {
        setCourses([]);
        setTotal(0);
        setTotalPages(0);
      })
      .finally(() => setLoading(false));
  }, [q, category, price, rating, sort, page]);

  const pageNumbers = useMemo(() => getPageNumbers(page, totalPages), [page, totalPages]);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setParams(next);
  };

  const goToPage = (nextPage) => {
    const next = new URLSearchParams(params);
    if (nextPage <= 1) next.delete('page');
    else next.set('page', String(nextPage));
    setParams(next);
  };

  const activeFilters = [category, price, rating, q].filter(Boolean).length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <nav className="text-sm text-slate-500">
        <Link to="/" className="hover:text-primary-600">
          Home
        </Link>
        <span className="mx-2">/</span>
        <span className="text-slate-900">Courses</span>
      </nav>
      <motion.h1
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="section-title mt-4"
      >
        All Courses
      </motion.h1>
      <p className="mt-2 text-slate-500">
        {loading ? 'Loading courses...' : `Discover ${total} published course${total === 1 ? '' : 's'}`}
        {activeFilters ? ' matching your filters' : ''}
      </p>

      <div className="card mt-8 p-4 lg:p-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              defaultValue={q}
              key={q}
              placeholder="Search courses..."
              className="input-field pl-10"
              onKeyDown={(e) => {
                if (e.key === 'Enter') updateParam('q', e.target.value.trim());
              }}
            />
          </div>
          <select
            value={category}
            onChange={(e) => updateParam('category', e.target.value)}
            className="input-field w-auto min-w-[140px]"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c.slug}>
                {c.name} ({c.courseCount || 0})
              </option>
            ))}
          </select>
          <select
            value={price}
            onChange={(e) => updateParam('price', e.target.value)}
            className="input-field w-auto min-w-[120px]"
          >
            {PRICE_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
          <select
            value={rating}
            onChange={(e) => updateParam('rating', e.target.value)}
            className="input-field w-auto min-w-[120px]"
          >
            {RATING_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => updateParam('sort', e.target.value)}
            className="input-field w-auto min-w-[160px]"
          >
            {SORT_OPTIONS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="mt-16 flex justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
        </div>
      ) : (
        <>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {courses.map((c, i) => (
              <CourseCard
                key={c._id}
                course={c}
                badge={sort === 'popular' && page === 1 && i < 2 ? 'Popular' : null}
                index={i}
              />
            ))}
          </div>
          {courses.length === 0 && (
            <p className="mt-16 text-center text-slate-500">No courses found. Try different filters.</p>
          )}
          {totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => goToPage(page - 1)}
                className="rounded-xl border border-slate-200 p-2 disabled:opacity-40"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              {pageNumbers.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => goToPage(n)}
                  className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-semibold ${
                    page === n ? 'bg-primary-500 text-white' : 'border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => goToPage(page + 1)}
                className="rounded-xl border border-slate-200 p-2 disabled:opacity-40"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
