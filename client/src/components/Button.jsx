import { motion } from 'framer-motion';

export default function Button({ children, variant = 'primary', className = '', size = 'md', ...props }) {
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };
  const base = `inline-flex items-center justify-center rounded-xl font-semibold transition duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-950 disabled:opacity-50 disabled:pointer-events-none ${sizes[size]}`;
  const variants = {
    primary: 'bg-primary-500 text-white shadow-sm shadow-primary-500/25 hover:bg-primary-600 hover:shadow-lg hover:shadow-primary-500/30',
    outline:
      'border border-slate-200 bg-white text-slate-700 hover:border-primary-300 hover:bg-primary-50 hover:shadow-soft dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-primary-500/60 dark:hover:bg-slate-800',
    danger: 'bg-red-500 text-white hover:bg-red-600 hover:shadow-lg hover:shadow-red-500/20',
    ghost: 'text-primary-600 hover:bg-primary-50 dark:text-primary-300 dark:hover:bg-primary-500/10',
    secondary:
      'bg-primary-50 text-primary-700 hover:bg-primary-100 dark:bg-primary-500/15 dark:text-primary-300 dark:hover:bg-primary-500/25',
  };

  return (
    <motion.button
      whileHover={{ scale: props.disabled ? 1 : 1.02 }}
      whileTap={{ scale: props.disabled ? 1 : 0.98 }}
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}
