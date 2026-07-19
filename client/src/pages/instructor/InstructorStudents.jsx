import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import api from '../../services/api';
import Button from '../../components/Button';

export default function InstructorStudents() {
  const [students, setStudents] = useState([]);

  useEffect(() => {
    api.get('/instructor/students').then((r) => setStudents(r.data.data));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold">Students</h1>
      <p className="mt-1 text-sm text-gray-500">Learners enrolled in your courses</p>
      <table className="mt-6 w-full rounded-xl border bg-white text-sm">
        <thead className="bg-gray-50 text-left">
          <tr>
            <th className="p-4">Student</th>
            <th>Email</th>
            <th>Courses</th>
            <th>Enrolled</th>
            <th className="p-4">Message</th>
          </tr>
        </thead>
        <tbody>
          {students.length === 0 ? (
            <tr>
              <td colSpan={5} className="p-8 text-center text-gray-500">
                No students yet.
              </td>
            </tr>
          ) : (
            students.map((s) => (
              <tr key={s._id} className="border-t">
                <td className="p-4 font-medium">{s.name}</td>
                <td className="text-gray-600">{s.email}</td>
                <td>
                  <ul className="space-y-1">
                    {s.courses?.map((c, i) => (
                      <li key={i} className="text-gray-700">
                        {c.title}{' '}
                        <span className="text-gray-400">({c.progress || 0}%)</span>
                      </li>
                    ))}
                  </ul>
                </td>
                <td className="text-gray-500">
                  {s.enrolledAt ? new Date(s.enrolledAt).toLocaleDateString() : '—'}
                </td>
                <td className="p-4">
                  <Link to={`/instructor/messages?user=${s._id}`}>
                    <Button variant="outline" className="gap-1 text-xs">
                      <MessageSquare className="h-4 w-4" />
                      Chat
                    </Button>
                  </Link>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
