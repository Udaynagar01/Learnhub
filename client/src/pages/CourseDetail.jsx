import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Tab } from '@headlessui/react';
import { Star, Clock, Globe, Award, Play, Check, Heart } from 'lucide-react';
import CourseCard from '../components/CourseCard';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import { resolveImageUrl } from '../utils/mediaUrl';

export default function CourseDetail() {
  const { slug } = useParams();
  const [course, setCourse] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [enrolled, setEnrolled] = useState(false);
  const [inWishlist, setInWishlist] = useState(false);
  const [related, setRelated] = useState([]);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [reviewMsg, setReviewMsg] = useState('');
  const { user, addToCart } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get(`/courses/${slug}`).then((r) => setCourse(r.data.data.course));
    api.get(`/courses/${slug}/reviews`).then((r) => setReviews(r.data.data)).catch(() => {});
    api.get(`/courses/${slug}/related`).then((r) => setRelated(r.data.data)).catch(() => {});
  }, [slug, user]);

  useEffect(() => {
    if (course && user) {
      api.get(`/enrollments/check/${course._id}`).then((r) => setEnrolled(r.data.data.enrolled)).catch(() => {});
      api.get(`/wishlist/check/${course._id}`).then((r) => setInWishlist(r.data.data.inWishlist)).catch(() => {});
    }
  }, [course, user]);

  const toggleWishlist = async () => {
    if (!user) return navigate('/login');
    if (inWishlist) {
      await api.delete(`/wishlist/${course._id}`);
      setInWishlist(false);
    } else {
      await api.post(`/wishlist/${course._id}`);
      setInWishlist(true);
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!user) return navigate('/login');
    setReviewMsg('');
    try {
      await api.post(`/courses/${slug}/reviews`, reviewForm);
      const { data } = await api.get(`/courses/${slug}/reviews`);
      setReviews(data.data);
      setReviewForm({ rating: 5, comment: '' });
      setReviewMsg('Review submitted.');
    } catch (err) {
      setReviewMsg(err.response?.data?.message || 'Could not submit review');
    }
  };

  const handleEnroll = async () => {
    if (!user) return navigate('/login');
    try {
      if (course.isFree) {
        await api.post(`/enroll/${course._id}`);
        navigate('/dashboard/learning');
      } else {
        addToCart(course);
        navigate('/checkout');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  const thumbSrc = resolveImageUrl(course?.thumbnail);

  if (!course) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  const firstLesson = course.sections?.[0]?.lessons?.[0];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <p className="text-sm text-slate-500">
        <Link to="/" className="hover:text-primary-600">Home</Link> / <Link to="/courses" className="hover:text-primary-600">Courses</Link> / <span className="text-slate-900">{course.title}</span>
      </p>
      <div className="mt-6 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h1 className="font-display text-3xl font-bold text-slate-900">{course.title}</h1>
          <p className="mt-2 text-gray-600">{course.shortDescription || course.description?.slice(0, 200)}</p>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
            <span className="flex items-center text-amber-500">
              <Star className="mr-1 h-4 w-4 fill-current" />
              {course.rating} ({course.reviewCount} reviews)
            </span>
            <span>{course.studentCount} students</span>
            <span>By {course.instructorId?.name}</span>
          </div>

          <Tab.Group className="mt-8">
            <Tab.List className="flex gap-6 border-b border-slate-200">
              {['Overview', 'Curriculum', 'Instructor', 'Reviews'].map((t) => (
                <Tab
                  key={t}
                  className={({ selected }) =>
                    `pb-3 text-sm font-semibold outline-none transition ${
                      selected ? 'border-b-2 border-primary-500 text-primary-600' : 'text-slate-500 hover:text-slate-700'
                    }`
                  }
                >
                  {t}
                </Tab>
              ))}
            </Tab.List>
            <Tab.Panels className="mt-6">
              <Tab.Panel>
                <h3 className="font-semibold">What you will learn</h3>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {(course.whatYouLearn || []).map((item, i) => (
                    <li key={i} className="flex gap-2 text-sm">
                      <Check className="h-5 w-5 shrink-0 text-green-600" />
                      {item}
                    </li>
                  ))}
                </ul>
                <h3 className="mt-8 font-semibold">Requirements</h3>
                <ul className="mt-2 list-disc pl-5 text-sm text-gray-600">
                  {(course.requirements || []).map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </Tab.Panel>
              <Tab.Panel>
                {course.sections?.map((section) => (
                  <div key={section._id} className="mb-4">
                    <h4 className="font-medium">{section.title}</h4>
                    <ul className="mt-2 space-y-1">
                      {section.lessons?.map((l) => (
                        <li key={l._id} className="flex justify-between text-sm text-gray-600">
                          <span>{l.title}</span>
                          <span>{Math.floor(l.duration / 60)} min</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </Tab.Panel>
              <Tab.Panel>
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-2xl font-bold text-primary-700">
                    {course.instructorId?.name?.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold">{course.instructorId?.name}</p>
                    <p className="text-sm text-gray-500">Course Instructor</p>
                    {course.instructorId?._id && user && (
                      <Link
                        to={`/dashboard/messages?user=${course.instructorId._id}`}
                        className="mt-2 inline-block text-sm font-medium text-primary-600 hover:underline"
                      >
                        Message instructor
                      </Link>
                    )}
                  </div>
                </div>
              </Tab.Panel>
              <Tab.Panel>
                {enrolled && (
                  <form onSubmit={submitReview} className="mb-6 rounded-lg border bg-gray-50 p-4">
                    <p className="text-sm font-medium">Write a review</p>
                    <select
                      value={reviewForm.rating}
                      onChange={(e) => setReviewForm({ ...reviewForm, rating: Number(e.target.value) })}
                      className="mt-2 rounded border px-2 py-1 text-sm"
                    >
                      {[5, 4, 3, 2, 1].map((n) => (
                        <option key={n} value={n}>{n} stars</option>
                      ))}
                    </select>
                    <textarea
                      value={reviewForm.comment}
                      onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                      className="mt-2 w-full rounded border px-3 py-2 text-sm"
                      rows={3}
                      minLength={10}
                      placeholder="Share your experience (min 10 characters)"
                      required
                    />
                    {reviewMsg && <p className="mt-1 text-sm text-gray-600">{reviewMsg}</p>}
                    <Button type="submit" className="mt-2">Submit review</Button>
                  </form>
                )}
                {reviews.length === 0 ? (
                  <p className="text-gray-500">No reviews yet.</p>
                ) : (
                  reviews.map((r) => (
                    <div key={r._id} className="mb-4 border-b pb-4">
                      <p className="font-medium">{r.userId?.name}</p>
                      <p className="text-amber-500">{'★'.repeat(r.rating)}</p>
                      <p className="mt-1 text-sm text-gray-600">{r.comment}</p>
                    </div>
                  ))
                )}
              </Tab.Panel>
            </Tab.Panels>
          </Tab.Group>
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="glass-card p-5 shadow-soft">
            <div className="relative aspect-video overflow-hidden rounded-2xl bg-slate-900">
              {thumbSrc ? (
                <img src={thumbSrc} alt="" className="h-full w-full rounded-lg object-cover opacity-80" />
              ) : (
                <div className="flex h-full items-center justify-center text-gray-500">No thumbnail</div>
              )}
              <div className="absolute inset-0 flex items-center justify-center">
                <Play className="h-14 w-14 text-white" />
              </div>
            </div>
            <div className="mt-4">
              {course.isFree ? (
                <span className="text-2xl font-bold text-green-600">Free</span>
              ) : (
                <>
                  <span className="text-2xl font-bold">₹{course.price}</span>
                  {course.originalPrice > course.price && (
                    <span className="ml-2 text-gray-400 line-through">₹{course.originalPrice}</span>
                  )}
                </>
              )}
            </div>
            {enrolled && firstLesson ? (
              <Button className="mt-4 w-full" onClick={() => navigate(`/learn/${course._id}/${firstLesson._id}`)}>
                Continue Learning
              </Button>
            ) : (
              <>
                <Button className="mt-4 w-full" onClick={handleEnroll}>
                  {course.isFree ? 'Enroll Free' : 'Buy Now'}
                </Button>
                {!course.isFree && (
                  <Button variant="outline" className="mt-2 w-full" onClick={() => { addToCart(course); navigate('/checkout'); }}>
                    Add to Cart
                  </Button>
                )}
              </>
            )}
            {user && !enrolled && (
              <button
                type="button"
                onClick={toggleWishlist}
                className={`mt-3 flex w-full items-center justify-center gap-2 rounded-lg border py-2 text-sm font-medium ${
                  inWishlist ? 'border-primary-600 bg-primary-50 text-primary-700' : 'hover:bg-gray-50'
                }`}
              >
                <Heart className={`h-4 w-4 ${inWishlist ? 'fill-primary-600 text-primary-600' : ''}`} />
                {inWishlist ? 'In wishlist' : 'Add to wishlist'}
              </button>
            )}
            <ul className="mt-4 space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2"><Clock className="h-4 w-4" /> {course.totalDuration} min total</li>
              <li className="flex items-center gap-2"><Globe className="h-4 w-4" /> {course.language}</li>
              <li className="flex items-center gap-2"><Award className="h-4 w-4" /> Certificate included</li>
            </ul>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-16 border-t pt-12">
          <h2 className="text-xl font-bold">Related courses</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((c) => (
              <CourseCard key={c._id} course={c} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
