import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function StudentOrders() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    api.get('/orders/my').then((r) => setOrders(r.data.data));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold">My Orders</h1>
      <p className="mt-1 text-sm text-gray-500">Your course purchase history</p>
      {orders.length === 0 ? (
        <p className="mt-8 text-gray-500">
          No orders yet. <Link to="/courses" className="text-primary-600">Browse courses</Link>
        </p>
      ) : (
        <div className="mt-6 space-y-4">
          {orders.map((o) => (
            <div key={o._id} className="rounded-xl border bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm text-gray-500">
                  {new Date(o.createdAt).toLocaleString()}
                </span>
                <span
                  className={`rounded-full px-3 py-0.5 text-xs font-medium ${
                    o.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {o.status}
                </span>
              </div>
              <ul className="mt-3 space-y-2">
                {(o.courseIds || []).map((c) => (
                  <li key={c._id} className="flex items-center justify-between">
                    <Link to={`/courses/${c.slug}`} className="font-medium text-primary-600 hover:underline">
                      {c.title}
                    </Link>
                    <span className="text-sm text-gray-600">₹{c.price || 0}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 border-t pt-3 text-right font-semibold">Total: ₹{o.amount}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
