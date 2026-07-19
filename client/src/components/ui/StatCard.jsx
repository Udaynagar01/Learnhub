import { motion } from 'framer-motion';

export default function StatCard({ label, value, icon: Icon, trend, accent = 'primary', delay = 0 }) {
  const accents = {
    primary: 'bg-primary-50 text-primary-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    sky: 'bg-sky-50 text-sky-600',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className="card group p-6 transition hover:shadow-soft"
    >
      <div className="flex items-start justify-between">
        <div className={`rounded-2xl p-3 ${accents[accent] || accents.primary}`}>
          {Icon && <Icon className="h-6 w-6" />}
        </div>
        {trend != null && (
          <span className={`text-xs font-semibold ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {trend >= 0 ? '+' : ''}
            {trend}%
          </span>
        )}
      </div>
      <p className="mt-4 font-display text-2xl font-bold text-slate-900">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{label}</p>
    </motion.div>
  );
}
