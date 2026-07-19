import { useEffect, useState } from 'react';
import api from '../../services/api';
import Button from '../../components/Button';

export default function AdminCourses() {
  const [courses, setCourses] = useState([]);

  const load = () => api.get('/admin/courses').then((r) => setCourses(r.data.data));

  useEffect(() => { load(); }, []);

  const setStatus = async (id, status) => {
    await api.patch(`/admin/courses/${id}/status`, { status });
    load();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold">Courses</h1>
      <table className="mt-6 w-full rounded-xl border bg-white text-sm">
        <thead className="bg-gray-50"><tr><th className="p-4">Title</th><th>Instructor</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          {courses.map((c) => (
            <tr key={c._id} className="border-t">
              <td className="p-4">{c.title}</td>
              <td>{c.instructorId?.name}</td>
              <td>{c.status}</td>
              <td className="flex gap-2 p-4">
                {c.status !== 'published' && <Button onClick={() => setStatus(c._id, 'published')}>Publish</Button>}
                {c.status !== 'rejected' && <Button variant="danger" onClick={() => setStatus(c._id, 'rejected')}>Reject</Button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
