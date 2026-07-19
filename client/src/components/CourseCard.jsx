import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Users, Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { resolveImageUrl } from '../utils/mediaUrl';

export default function CourseCard({ course, badge, index = 0, onWishlistToggle }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const thumbSrc = resolveImageUrl(course.thumbnail);
  const discount =
    course.originalPrice && course.originalPrice > course.price
      ? Math.round(((course.originalPrice - course.price) / course.originalPrice) * 100)
      : null;

  const toggleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      if (course.inWishlist) {
        await api.delete(`/wishlist/${course._id}`);
        onWishlistToggle?.(course._id, false);
      } else {
        await api.post(`/wishlist/${course._id}`);
        onWishlistToggle?.(course._id, true);
      }
    } catch {}
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link to={`/courses/${course.slug}`} className="group card-hover block overflow-hidden">
        <div className="relative aspect-[16/10] bg-slate-100">
          {thumbSrc ? (
            <img
              src={thumbSrc}
              alt={course.title}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-slate-400">No image</div>
          )}

          {badge && (
            <span className="badge-bestseller absolute left-3 top-3 shadow-sm">{badge}</span>
          )}
          {discount && !badge && (
            <span className="badge-discount absolute left-3 top-3">{discount}% OFF</span>
          )}
          {discount && badge && (
            <span className="badge-discount absolute left-3 top-10">{discount}% OFF</span>
          )}

          <button
            type="button"
            onClick={toggleWishlist}
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 shadow-md backdrop-blur transition hover:scale-110"
            aria-label="Wishlist"
          >
            <Heart
              className={`h-4 w-4 transition duration-300 ${course.inWishlist ? 'fill-rose-500 text-rose-500' : 'text-slate-500 group-hover:text-rose-500'}`}
            />
          </button>
        </div>

        <div className="p-4">
          <h3 className="line-clamp-2 text-[15px] font-bold leading-snug text-slate-900 transition duration-300 group-hover:text-primary-600">
            {course.title}
          </h3>
          <p className="mt-1 text-xs text-slate-500">{course.instructorId?.name || 'Instructor'}</p>

          <div className="mt-2.5 flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 font-semibold text-amber-500">
              <Star className="h-3.5 w-3.5 fill-current" />
              {course.rating?.toFixed(1) || '4.5'}
            </span>
            <span className="text-slate-400">
              ({(course.studentCount || 0).toLocaleString()})
            </span>
          </div>

          <div className="mt-3 flex flex-wrap items-baseline gap-2">
            {course.isFree ? (
              <span className="text-lg font-bold text-emerald-600">Free</span>
            ) : (
              <>
                <span className="text-lg font-bold text-slate-900">₹{course.price}</span>
                {course.originalPrice > course.price && (
                  <>
                    <span className="text-sm text-slate-400 line-through">₹{course.originalPrice}</span>
                    {discount && (
                      <span className="text-xs font-bold text-rose-500">{discount}% off</span>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
