import { motion } from 'framer-motion';

export default function GlassCard({ children, className = '', delay = 0, ...props }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay }}
      className={`glass-card ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
}
