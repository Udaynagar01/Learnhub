import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Trash2, ClipboardList, Megaphone } from 'lucide-react';
import api from '../../services/api';
import Button from '../../components/Button';
import { resolveImageUrl } from '../../utils/mediaUrl';

export default function InstructorCourses() {
  const [courses, setCourses] = useState([]);

  const load = () => api.get('/instructor/courses').then((r) => setCourses(r.data.data));

  useEffect(() => { load(); }, []);

  const remove = async (id) => {
    if (!confirm('Delete course?')) return;
    await api.delete(`/instructor/courses/${id}`);
    load();
  };

  const togglePublish = async (c) => {
    const next = c.status === 'published' ? 'draft' : 'published';
    try {
      await api.patch(`/instructor/courses/${c._id}/status`, { status: next });
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not update status');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Courses</h1>
        <Link to="/instructor/courses/new"><Button>+ Create New Course</Button></Link>
      </div>
      <div className="mt-6 overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="p-4">Course</th>
              <th>Students</th>
              <th>Price</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((c) => {
              const thumbSrc = resolveImageUrl(c.thumbnail);
              return (
              <tr key={c._id} className="border-t">
                <td className="flex items-center gap-3 p-4">
                  {thumbSrc ? <img src={thumbSrc} alt="" className="h-10 w-16 rounded object-cover" /> : null}
                  {c.title}
                </td>
                <td>{c.studentCount}</td>
                <td>{c.isFree ? 'Free' : `₹${c.price}`}</td>
                <td>
                  <span className={`rounded px-2 py-0.5 text-xs font-medium ${
                    c.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {c.status}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => togglePublish(c)}
                      className="rounded px-2 py-1 text-xs font-medium bg-primary-50 text-primary-700 hover:bg-primary-100"
                    >
                      {c.status === 'published' ? 'Unpublish' : 'Publish'}
                    </button>
                    <Link to={`/instructor/courses/${c._id}/quiz`} className="text-gray-600" title="Edit quiz">
                      <ClipboardList className="h-4 w-4" />
                    </Link>
                    <Link to={`/instructor/announcements?course=${c._id}`} className="text-primary-600" title="Announcements">
                      <Megaphone className="h-4 w-4" />
                    </Link>
                    <Link to={`/instructor/courses/edit/${c._id}`} className="text-primary-600"><Pencil className="h-4 w-4" /></Link>
                    <button type="button" onClick={() => remove(c._id)} className="text-red-600"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
