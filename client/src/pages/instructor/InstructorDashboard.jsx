import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Users, IndianRupee, Star, TrendingUp } from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import api from '../../services/api';
import Button from '../../components/Button';
import StatCard from '../../components/ui/StatCard';
import GlassCard from '../../components/ui/GlassCard';

export default function InstructorDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/instructor/stats').then((r) => setStats(r.data.data));
  }, []);

  if (!stats) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="section-title">Instructor Dashboard</h1>
          <p className="mt-1 text-slate-500">Track revenue, students, and course performance</p>
        </div>
        <div className="flex gap-3">
          <Link to="/instructor/courses/new">
            <Button>+ Create Course</Button>
          </Link>
          <Link to="/instructor/courses">
            <Button variant="outline">Manage Courses</Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Courses" value={stats.totalCourses} icon={BookOpen} trend={8} delay={0} />
        <StatCard label="Total Students" value={stats.totalStudents?.toLocaleString?.() || stats.totalStudents} icon={Users} accent="sky" trend={15} delay={0.05} />
        <StatCard label="Total Earnings" value={`₹${stats.totalEarnings?.toLocaleString?.() || stats.totalEarnings}`} icon={IndianRupee} accent="emerald" trend={22} delay={0.1} />
        <StatCard label="Avg Rating" value={stats.avgRating} icon={Star} accent="amber" delay={0.15} />
      </div>

      <GlassCard className="p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-slate-900">Earnings Overview</h2>
          <span className="flex items-center gap-1 text-sm font-medium text-emerald-600">
            <TrendingUp className="h-4 w-4" /> +22% this month
          </span>
        </div>
        <div className="mt-6 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.earningsChart || []}>
              <defs>
                <linearGradient id="earnGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6D5DFB" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#6D5DFB" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }} />
              <Area type="monotone" dataKey="earnings" stroke="#6D5DFB" strokeWidth={2} fill="url(#earnGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard className="p-6">
          <h2 className="font-semibold text-slate-900">Recent Students</h2>
          <ul className="mt-4 space-y-3">
            {(stats.recentStudents || []).map((s, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 rounded-xl p-2 hover:bg-slate-50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-sm font-bold text-white">
                  {s.name?.charAt(0)}
                </div>
                <span className="font-medium">{s.name}</span>
              </motion.li>
            ))}
            {(stats.recentStudents || []).length === 0 && (
              <p className="text-sm text-slate-500">No recent enrollments</p>
            )}
          </ul>
        </GlassCard>

        <GlassCard className="p-6">
          <h2 className="font-semibold text-slate-900">Top Courses</h2>
          <table className="mt-4 w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="pb-2">Course</th>
                <th>Students</th>
                <th>Earnings</th>
              </tr>
            </thead>
            <tbody>
              {(stats.topCourses || []).map((c) => (
                <tr key={c._id} className="border-t border-slate-100">
                  <td className="py-3 font-medium">{c.title}</td>
                  <td>{c.students}</td>
                  <td className="font-semibold text-primary-600">₹{c.earnings}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassCard>
      </div>

      <GlassCard className="p-6">
        <h2 className="font-semibold text-slate-900">Recent Reviews</h2>
        <div className="mt-4 space-y-4">
          {(stats.recentReviews || [{ name: 'Student', rating: 5, comment: 'Great course!', course: 'React' }]).slice(0, 3).map((r, i) => (
            <div key={i} className="flex gap-3 border-b border-slate-100 pb-4 last:border-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 font-bold text-primary-700">
                {r.name?.charAt(0) || 'S'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{r.name || 'Student'}</span>
                  <span className="text-amber-500">★ {r.rating || 5}</span>
                </div>
                <p className="mt-1 text-sm text-slate-600">{r.comment || r.text}</p>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
