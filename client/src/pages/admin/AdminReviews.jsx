import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Button from '../../components/Button';

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);

  const load = () => {
    api.get('/admin/reviews').then((r) => setReviews(r.data.data));
  };

  useEffect(() => {
    load();
  }, []);

  const remove = async (id) => {
    if (!confirm('Remove this review?')) return;
    await api.delete(`/admin/reviews/${id}`);
    load();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold">Reviews</h1>
      <p className="mt-1 text-sm text-gray-500">Moderate course reviews</p>
      <div className="mt-6 space-y-4">
        {reviews.map((r) => (
          <div key={r._id} className="rounded-xl border bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold">{r.userId?.name}</p>
                <p className="text-sm text-gray-500">{r.userId?.email}</p>
                <Link to={`/courses/${r.courseId?.slug}`} className="mt-1 text-sm text-primary-600">
                  {r.courseId?.title}
                </Link>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-amber-50 px-2 py-1 text-sm text-amber-700">
                  ★ {r.rating}
                </span>
                <Button variant="outline" className="text-sm text-red-600" onClick={() => remove(r._id)}>
                  Remove
                </Button>
              </div>
            </div>
            <p className="mt-3 text-gray-700">{r.comment}</p>
            <p className="mt-2 text-xs text-gray-400">{new Date(r.createdAt).toLocaleString()}</p>
          </div>
        ))}
        {reviews.length === 0 && <p className="text-gray-500">No reviews yet.</p>}
      </div>
    </div>
  );
}
