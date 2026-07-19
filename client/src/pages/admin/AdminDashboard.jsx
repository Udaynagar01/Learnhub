import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, GraduationCap, BookOpen, IndianRupee } from 'lucide-react';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import api from '../../services/api';
import StatCard from '../../components/ui/StatCard';
import GlassCard from '../../components/ui/GlassCard';

const ROLE_COLORS = ['#6D5DFB', '#34d399', '#fbbf24'];

export default function AdminDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/admin/analytics').then((r) => setData(r.data.data));
  }, []);

  if (!data) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  const roleData = data.usersByRole || [
    { name: 'Students', value: data.totalUsers ? Math.floor(data.totalUsers * 0.85) : 850 },
    { name: 'Instructors', value: data.totalInstructors || 45 },
    { name: 'Admins', value: 5 },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="section-title">Admin Dashboard</h1>
        <p className="mt-1 text-slate-500">Platform overview and analytics</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Users" value={data.totalUsers?.toLocaleString?.() || data.totalUsers} icon={Users} trend={18} delay={0} />
        <StatCard label="Instructors" value={data.totalInstructors} icon={GraduationCap} accent="sky" delay={0.05} />
        <StatCard label="Courses" value={data.totalCourses} icon={BookOpen} accent="amber" delay={0.1} />
        <StatCard label="Total Revenue" value={`₹${data.totalRevenue?.toLocaleString?.() || data.totalRevenue}`} icon={IndianRupee} accent="emerald" trend={24} delay={0.15} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <GlassCard className="p-6 lg:col-span-2">
          <h2 className="font-display text-lg font-bold text-slate-900">Revenue Overview</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.revenueChart || data.userGrowth || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none' }} />
                <Line type="monotone" dataKey="revenue" stroke="#6D5DFB" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="users" stroke="#34d399" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h2 className="font-display text-lg font-bold text-slate-900">Users by Role</h2>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={roleData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                >
                  {roleData.map((_, i) => (
                    <Cell key={i} fill={ROLE_COLORS[i % ROLE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard className="p-6">
          <h2 className="font-semibold text-slate-900">Recent Activities</h2>
          <ul className="mt-4 space-y-3">
            {(data.recentActivities || data.recentOrders || []).slice(0, 6).map((o, i) => (
              <motion.li
                key={o._id || i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3 text-sm"
              >
                <span>{o.userId?.name || o.title || o.message || 'Activity'}</span>
                <span className="font-medium text-primary-600">
                  {o.amount != null ? `₹${o.amount}` : o.type || ''}
                </span>
              </motion.li>
            ))}
          </ul>
        </GlassCard>

        <GlassCard className="p-6">
          <h2 className="font-semibold text-slate-900">Top Selling Courses</h2>
          <table className="mt-4 w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th>Course</th>
                <th>Sales</th>
                <th>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {(data.topCourses || []).map((c) => (
                <tr key={c._id} className="border-t border-slate-100">
                  <td className="py-3 font-medium">{c.title}</td>
                  <td>{c.sales}</td>
                  <td className="font-semibold text-emerald-600">₹{c.revenue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassCard>
      </div>
    </div>
  );
}
