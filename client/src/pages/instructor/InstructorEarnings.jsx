import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../services/api';

export default function InstructorEarnings() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/instructor/earnings').then((r) => setData(r.data.data));
  }, []);

  if (!data) return <div>Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold">Earnings</h1>
      <p className="mt-1 text-sm text-gray-500">Revenue from your paid courses</p>

      <div className="mt-6 rounded-xl border bg-white p-6">
        <p className="text-sm text-gray-500">Total earnings</p>
        <p className="text-3xl font-bold text-primary-600">₹{data.totalEarnings}</p>
      </div>

      <div className="mt-8 rounded-xl border bg-white p-6">
        <h2 className="font-semibold">By course</h2>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.byCourse || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="title" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={60} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="earnings" fill="#4f46e5" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <table className="mt-6 w-full text-sm">
          <thead className="text-left text-gray-500">
            <tr>
              <th className="pb-2">Course</th>
              <th>Sales</th>
              <th>Gross</th>
              <th>Your share</th>
            </tr>
          </thead>
          <tbody>
            {data.byCourse?.map((c) => (
              <tr key={c.courseId} className="border-t">
                <td className="py-3 font-medium">{c.title}</td>
                <td>{c.sales}</td>
                <td>₹{c.gross}</td>
                <td className="font-semibold text-primary-600">₹{c.earnings}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8 rounded-xl border bg-white p-6">
        <h2 className="font-semibold">Recent payouts</h2>
        <ul className="mt-4 divide-y">
          {data.recentPayouts?.length === 0 && (
            <li className="py-4 text-gray-500">No paid orders yet.</li>
          )}
          {data.recentPayouts?.map((p) => (
            <li key={p.orderId} className="flex justify-between py-3 text-sm">
              <span>{p.student || 'Student'} · {new Date(p.date).toLocaleDateString()}</span>
              <span className="font-medium text-green-600">+₹{p.amount}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
