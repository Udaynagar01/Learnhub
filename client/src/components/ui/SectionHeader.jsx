import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

export default function SectionHeader({ title, subtitle, linkTo, linkLabel = 'View all' }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      className="flex flex-wrap items-end justify-between gap-4"
    >
      <div>
        <h2 className="section-title">{title}</h2>
        {subtitle && <p className="mt-1 text-slate-500">{subtitle}</p>}
      </div>
      {linkTo && (
        <Link
          to={linkTo}
          className="flex items-center gap-1 text-sm font-bold text-primary-500 hover:text-primary-600"
        >
          {linkLabel}
          <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </motion.div>
  );
}
