import { useEffect, useState } from 'react';
import api from '../../services/api';
import Button from '../../components/Button';

export default function AdminInstructors() {
  const [pending, setPending] = useState([]);

  const load = () => api.get('/admin/instructors/pending').then((r) => setPending(r.data.data));

  useEffect(() => { load(); }, []);

  const approve = async (id, status) => {
    await api.patch(`/admin/instructors/${id}/approve`, { status });
    load();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold">Instructor Applications</h1>
      <div className="mt-6 space-y-4">
        {pending.length === 0 ? (
          <p className="text-gray-500">No pending applications.</p>
        ) : (
          pending.map((u) => (
            <div key={u._id} className="flex items-center justify-between rounded-xl border bg-white p-4">
              <div>
                <p className="font-semibold">{u.name}</p>
                <p className="text-sm text-gray-500">{u.email}</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => approve(u._id, 'approved')}>Approve</Button>
                <Button variant="danger" onClick={() => approve(u._id, 'rejected')}>Reject</Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
