import { useEffect, useState } from 'react';
import api from '../../services/api';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    api.get('/admin/orders').then((r) => setOrders(r.data.data));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold">Orders</h1>
      <table className="mt-6 w-full rounded-xl border bg-white text-sm">
        <thead className="bg-gray-50">
          <tr><th className="p-4">User</th><th>Amount</th><th>Status</th><th>Date</th></tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o._id} className="border-t">
              <td className="p-4">{o.userId?.name || o.userId?.email}</td>
              <td>₹{o.amount}</td>
              <td><span className={`rounded px-2 py-0.5 text-xs ${o.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-gray-100'}`}>{o.status}</span></td>
              <td>{new Date(o.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
