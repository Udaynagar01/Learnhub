import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Award,
  Clock,
  Flame,
  Heart,
  ClipboardList,
  Activity,
  Calendar,
  ChevronRight,
} from 'lucide-react';
import api from '../services/api';
import StatCard from '../components/ui/StatCard';
import GlassCard from '../components/ui/GlassCard';
import SectionHeader from '../components/ui/SectionHeader';
import { resolveImageUrl } from '../utils/mediaUrl';
import Button from '../components/Button';

export default function StudentDashboard() {
  const [enrolled, setEnrolled] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [stats, setStats] = useState({
    courses: 0,
    certificates: 0,
    hours: 0,
    streak: 7,
  });

  useEffect(() => {
    api
      .get('/enrollments/my-learning')
      .then((r) => {
        const data = r.data.data;
        setEnrolled(data.enrolled || []);
        setWishlist(data.wishlist || []);
        const completed = data.completed || [];
        setStats({
          courses: (data.enrolled || []).length,
          certificates: completed.length,
          hours: Math.round((data.enrolled || []).reduce((s, e) => s + (e.progressPercent || 0), 0) / 10),
          streak: 7,
        });
      })
      .catch(() => {});
  }, []);

  const continueCourse = enrolled.find((e) => e.progressPercent < 100) || enrolled[0];

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Enrolled Courses" value={stats.courses} icon={BookOpen} accent="primary" delay={0} />
        <StatCard label="Certificates" value={stats.certificates} icon={Award} accent="amber" delay={0.05} />
        <StatCard label="Learning Hours" value={`${stats.hours}h`} icon={Clock} accent="sky" delay={0.1} />
        <StatCard label="Day Streak" value={stats.streak} icon={Flame} accent="emerald" trend={12} delay={0.15} />
      </div>

      {continueCourse && (
        <GlassCard className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-primary-600">Continue Learning</p>
              <h2 className="mt-1 font-display text-xl font-bold text-slate-900">
                {continueCourse.courseId?.title}
              </h2>
              <div className="mt-3 h-2 w-48 max-w-full rounded-full bg-slate-100">
                <div
                  className="h-2 rounded-full bg-primary-500"
                  style={{ width: `${continueCourse.progressPercent || 0}%` }}
                />
              </div>
              <p className="mt-1 text-sm text-slate-500">{continueCourse.progressPercent || 0}% complete</p>
            </div>
            <Link
              to={`/learn/${continueCourse.courseId?._id}/${continueCourse.courseId?.sections?.[0]?.lessons?.[0]?._id}`}
            >
              <Button size="lg">
                Resume
                <ChevronRight className="ml-1 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </GlassCard>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <SectionHeader title="Wishlist" linkTo="/dashboard/wishlist" linkLabel="View all" />
          <div className="mt-4 space-y-3">
            {wishlist.length === 0 ? (
              <GlassCard className="p-6 text-center text-slate-500">
                <Heart className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-2">No wishlist items yet</p>
              </GlassCard>
            ) : (
              wishlist.slice(0, 3).map((item) => (
                <Link
                  key={item._id}
                  to={`/courses/${item.courseId?.slug}`}
                  className="card flex items-center gap-4 p-4 transition hover:shadow-soft"
                >
                  <div className="h-14 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                    {resolveImageUrl(item.courseId?.thumbnail) && (
                      <img
                        src={resolveImageUrl(item.courseId?.thumbnail)}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{item.courseId?.title}</p>
                    <p className="text-sm text-primary-600">₹{item.courseId?.price}</p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        <div>
          <SectionHeader title="Recent Activity" />
          <GlassCard className="mt-4 p-4">
            <ul className="space-y-4">
              {[
                { icon: BookOpen, text: 'Completed lesson: React Hooks', time: '2h ago' },
                { icon: Award, text: 'Earned certificate: UI Design', time: '1d ago' },
                { icon: ClipboardList, text: 'Quiz score: 92% on Node.js', time: '2d ago' },
              ].map((a, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="rounded-lg bg-primary-50 p-2 text-primary-600">
                    <a.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{a.text}</p>
                    <p className="text-xs text-slate-400">{a.time}</p>
                  </div>
                </li>
              ))}
            </ul>
          </GlassCard>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <GlassCard className="p-5">
          <div className="flex items-center gap-3">
            <ClipboardList className="h-8 w-8 text-primary-500" />
            <div>
              <h3 className="font-semibold">Assignments</h3>
              <p className="text-sm text-slate-500">2 pending due this week</p>
            </div>
          </div>
          <Link to="/dashboard/learning" className="mt-4 block text-sm font-semibold text-primary-600">
            View assignments →
          </Link>
        </GlassCard>
        <GlassCard className="p-5">
          <div className="flex items-center gap-3">
            <Calendar className="h-8 w-8 text-sky-500" />
            <div>
              <h3 className="font-semibold">Calendar</h3>
              <p className="text-sm text-slate-500">Live session tomorrow 4 PM</p>
            </div>
          </div>
        </GlassCard>
        <GlassCard className="p-5">
          <div className="flex items-center gap-3">
            <Activity className="h-8 w-8 text-emerald-500" />
            <div>
              <h3 className="font-semibold">AI Recommendations</h3>
              <p className="text-sm text-slate-500">3 courses picked for you</p>
            </div>
          </div>
          <Link to="/courses" className="mt-4 block text-sm font-semibold text-primary-600">
            Explore →
          </Link>
        </GlassCard>
      </div>
    </div>
  );
}
