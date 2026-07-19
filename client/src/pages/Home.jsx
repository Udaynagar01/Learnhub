import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Award,
  BarChart3,
  BookOpen,
  Briefcase,
  Camera,
  CheckCircle2,
  Code,
  FileCheck2,
  GraduationCap,
  MessageSquare,
  Music,
  Palette,
  PlayCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  Users,
} from 'lucide-react';
import api from '../services/api';
import CourseCard from '../components/CourseCard';
import SectionHeader from '../components/ui/SectionHeader';

const iconMap = {
  development: Code,
  design: Palette,
  business: Briefcase,
  marketing: TrendingUp,
  photography: Camera,
  music: Music,
};

const platformFeatures = [
  {
    title: 'Structured video learning',
    text: 'Courses are organized into sections, lessons, progress tracking, and resumable video playback.',
    icon: PlayCircle,
  },
  {
    title: 'Notes, Q&A, and announcements',
    text: 'Learners can save notes, ask lesson-specific questions, and receive instructor updates.',
    icon: MessageSquare,
  },
  {
    title: 'Quizzes and certificates',
    text: 'Assess understanding with quizzes and issue verifiable completion certificates.',
    icon: FileCheck2,
  },
  {
    title: 'Role-based dashboards',
    text: 'Separate student, instructor, and admin spaces keep daily workflows focused.',
    icon: ShieldCheck,
  },
];

const workflow = [
  { title: 'Discover', text: 'Search courses by topic, skill, level, or instructor.', icon: Search },
  { title: 'Learn', text: 'Watch lessons, save notes, and continue where you left off.', icon: BookOpen },
  { title: 'Practice', text: 'Complete quizzes and discuss doubts with instructors.', icon: CheckCircle2 },
  { title: 'Prove', text: 'Download and verify certificates after completion.', icon: Award },
];

const faqs = [
  {
    question: 'Can students track progress?',
    answer: 'Yes. LearnHub tracks completed lessons, course progress, quiz status, and completed certificates.',
  },
  {
    question: 'Can instructors manage students?',
    answer: 'Yes. Instructors can create courses, view enrolled students, post announcements, and manage quizzes.',
  },
  {
    question: 'Are certificates verifiable?',
    answer: 'Yes. Each completed certificate has an ID that can be checked from the public verification page.',
  },
];

export default function Home() {
  const navigate = useNavigate();
  const [heroQuery, setHeroQuery] = useState('');
  const [categories, setCategories] = useState([]);
  const [trending, setTrending] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [topInstructors, setTopInstructors] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({
    learners: 0,
    courses: 0,
    certificates: 0,
    avgRating: 0,
    courseEnrollments: 0,
  });
  const [loadingHome, setLoadingHome] = useState(true);

  useEffect(() => {
    api
      .get('/home')
      .then((r) => {
        const data = r.data.data || {};
        setCategories(data.categories || []);
        setTrending(data.trending || []);
        setRecommended(data.recommended || []);
        setTopInstructors(data.topInstructors || []);
        setReviews(data.reviews || []);
        setStats(data.stats || {});
      })
      .catch(() => {})
      .finally(() => setLoadingHome(false));
  }, []);

  const heroSearch = (e) => {
    e.preventDefault();
    navigate(heroQuery.trim() ? `/courses?q=${encodeURIComponent(heroQuery.trim())}` : '/courses');
  };

  const EmptyState = ({ text, action }) => (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900">
      <p>{text}</p>
      {action}
    </div>
  );

  return (
    <div className="bg-page-mesh dark:bg-slate-950">
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="grid items-center gap-10 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900 lg:grid-cols-[1.05fr_0.95fr] lg:p-10"
        >
          <motion.div
            initial={{ opacity: 0, x: -18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary-700 dark:bg-primary-500/15 dark:text-primary-300">
              <Sparkles className="h-3.5 w-3.5 animate-pulse-soft" />
              Learn, practice, certify
            </span>
            <h1 className="mt-5 font-display text-4xl font-bold leading-tight text-slate-950 dark:text-white sm:text-5xl lg:text-6xl">
              Build skills with a complete learning platform
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 dark:text-slate-300">
              Explore expert-led courses, save lesson notes, ask questions, complete quizzes,
              and earn verifiable certificates from one focused workspace.
            </p>

            <form onSubmit={heroSearch} className="mt-8 flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={heroQuery}
                  onChange={(e) => setHeroQuery(e.target.value)}
                  placeholder="Search React, design, marketing..."
                  className="input-field py-3.5 pl-12 text-base"
                />
              </div>
              <button type="submit" className="btn-primary px-7 py-3.5">
                Search
              </button>
            </form>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/courses" className="btn-primary">
                Browse courses
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                to="/verify-certificate"
                className="hover-lift inline-flex items-center justify-center rounded-xl border border-slate-200 bg-[#ffffff] px-5 py-2.5 text-sm font-semibold text-[#334155] transition hover:border-primary-300 hover:bg-primary-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                Verify certificate
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="grid gap-4"
          >
            <div className="animate-float-slow rounded-2xl bg-slate-950 p-5 text-white shadow-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Learning dashboard</p>
                  <p className="mt-1 text-2xl font-bold">72% complete</p>
                </div>
                <BarChart3 className="h-9 w-9 text-primary-300" />
              </div>
              <div className="mt-5 h-2 rounded-full bg-white/10">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '72%' }}
                  transition={{ duration: 0.9, delay: 0.45, ease: 'easeOut' }}
                  className="h-2 rounded-full bg-primary-400"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { label: 'Active learners', value: stats.learners || 0, icon: Users },
                { label: 'Published courses', value: stats.courses || 0, icon: BookOpen },
                { label: 'Certificates', value: stats.certificates || 0, icon: Award },
                { label: 'Avg rating', value: stats.avgRating || 'New', icon: Star },
              ].map(({ label, value, icon: Icon }, index) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -6, scale: 1.02 }}
                  transition={{ duration: 0.3, delay: 0.25 + index * 0.06 }}
                  className="hover-glow rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-800"
                >
                  <Icon className="h-5 w-5 text-primary-500" />
                  <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <SectionHeader title="Explore Categories" subtitle="Start with a skill area" linkTo="/courses" />
        {categories.length ? (
          <div className="mt-6 grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
            {categories.slice(0, 6).map((cat) => {
              const Icon = iconMap[cat.slug] || BookOpen;
              return (
                <Link key={cat._id} to={`/courses?category=${cat.slug}`} className="group card-hover p-5">
                  <Icon className="h-6 w-6 text-primary-500" />
                  <p className="mt-4 font-bold text-slate-900 transition duration-300 group-hover:text-primary-600 dark:text-white">{cat.name}</p>
                  <p className="mt-1 text-sm text-slate-500">{cat.courseCount || 0} courses</p>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="mt-6">
            <EmptyState text={loadingHome ? 'Loading categories...' : 'No categories available yet.'} />
          </div>
        )}
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <SectionHeader title="How LearnHub Works" subtitle="A practical path from lesson to certificate" />
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          {workflow.map(({ title, text, icon: Icon }, index) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -6 }}
              className="hover-glow rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-500/15 dark:text-primary-300">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-bold text-slate-900 dark:text-white">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <SectionHeader title="Trending Courses" subtitle="Most popular courses by enrollments and ratings" linkTo="/courses?sort=popular" />
        {trending.length ? (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {trending.map((course, index) => (
              <CourseCard
                key={course._id}
                course={course}
                badge={index < 2 && (course.studentCount || 0) > 0 ? 'Popular' : null}
                index={index}
              />
            ))}
          </div>
        ) : (
          <div className="mt-6">
            <EmptyState
              text={loadingHome ? 'Loading courses...' : 'No published courses yet.'}
              action={<Link to="/instructor/courses/new" className="mt-3 inline-block font-semibold text-primary-600">Create the first course</Link>}
            />
          </div>
        )}
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <SectionHeader title="Platform Features" subtitle="Built for real student and instructor workflows" />
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {platformFeatures.map(({ title, text, icon: Icon }) => (
            <div key={title} className="hover-lift hover-glow rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <Icon className="h-6 w-6 text-primary-500" />
              <h3 className="mt-4 font-bold text-slate-900 dark:text-white">{title}</h3>
              <p className="mt-2 leading-7 text-slate-600 dark:text-slate-300">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <SectionHeader title="Top Instructors" subtitle="Based on published courses and student enrollments" linkTo="/courses" />
        {topInstructors.length ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {topInstructors.map((instructor) => (
              <div key={instructor._id} className="hover-lift hover-glow rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-primary-500 text-lg font-bold text-white">
                  {instructor.avatar ? (
                    <img src={instructor.avatar} alt="" className="h-full w-full object-cover" />
                  ) : (
                    instructor.name?.charAt(0)
                  )}
                </div>
                <p className="mt-4 font-bold text-slate-900 dark:text-white">{instructor.name}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {instructor.courses} courses · {instructor.students} students
                </p>
                <p className="mt-2 flex items-center gap-1 text-sm font-semibold text-amber-500">
                  <Star className="h-4 w-4 fill-current" />
                  {instructor.avgRating || 'New'}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-6">
            <EmptyState text={loadingHome ? 'Loading instructors...' : 'Top instructors will appear after courses are published.'} />
          </div>
        )}
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-soft lg:grid-cols-[1fr_320px] lg:p-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-primary-300">Certificates</p>
            <h2 className="mt-3 font-display text-3xl font-bold">Make achievements verifiable</h2>
            <p className="mt-3 max-w-2xl leading-7 text-slate-300">
              Completed students receive certificate IDs that can be checked from a public verification page.
            </p>
          </div>
          <div className="flex items-center gap-3 lg:justify-end">
            <Link to="/verify-certificate" className="rounded-xl bg-[#ffffff] px-5 py-3 text-sm font-bold text-[#020617]">
              Verify certificate
            </Link>
            <Link to="/dashboard/learning?tab=completed" className="rounded-xl border border-white/20 px-5 py-3 text-sm font-bold text-white">
              My certificates
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <SectionHeader title="Recommended Courses" subtitle="Newest courses on LearnHub" linkTo="/courses?sort=newest" linkLabel="See all" />
        {recommended.length ? (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {recommended.map((course, index) => (
              <CourseCard key={course._id} course={course} index={index} />
            ))}
          </div>
        ) : (
          <div className="mt-6">
            <EmptyState text={loadingHome ? 'Loading recommendations...' : 'Recommendations will appear after courses are published.'} />
          </div>
        )}
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <SectionHeader title="What Learners Say" />
        {reviews.length ? (
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {reviews.map((item) => (
              <div key={item._id} className="hover-lift hover-glow rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex gap-1 text-amber-400">
                  {Array.from({ length: Math.max(1, Math.min(5, item.rating || 5)) }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="mt-4 leading-7 text-slate-600 dark:text-slate-300">"{item.comment}"</p>
                <p className="mt-5 font-bold text-slate-900 dark:text-white">{item.userId?.name || 'Learner'}</p>
                <p className="text-sm text-slate-500">{item.courseId?.title || 'LearnHub course'}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-6">
            <EmptyState text={loadingHome ? 'Loading reviews...' : 'Learner reviews will appear after students review courses.'} />
          </div>
        )}
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
          <div>
            <h2 className="section-title">Frequently Asked Questions</h2>
            <p className="mt-3 text-slate-500 dark:text-slate-400">
              Quick answers for students and instructors before getting started.
            </p>
          </div>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <div key={faq.question} className="hover-glow rounded-2xl border border-slate-200 bg-white p-5 transition duration-300 hover:-translate-y-0.5 dark:border-slate-800 dark:bg-slate-900">
                <p className="font-bold text-slate-900 dark:text-white">{faq.question}</p>
                <p className="mt-2 leading-7 text-slate-600 dark:text-slate-300">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-14 pt-8 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] bg-cta-gradient p-8 text-white shadow-hero lg:flex lg:items-center lg:justify-between">
          <div>
            <h2 className="font-display text-3xl font-bold">Ready to teach on LearnHub?</h2>
            <p className="mt-3 max-w-2xl text-white/90">
              Create courses, publish lessons, manage students, and grow your teaching business.
            </p>
          </div>
          <Link
            to="/become-instructor"
            className="hover-lift mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-primary-600 lg:mt-0"
          >
            Become an instructor
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
