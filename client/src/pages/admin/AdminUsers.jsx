import { useEffect, useState } from 'react';
import api from '../../services/api';
import Button from '../../components/Button';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);

  const load = () => api.get('/admin/users').then((r) => setUsers(r.data.data));

  useEffect(() => { load(); }, []);

  const toggleBan = async (id, isBanned) => {
    await api.patch(`/admin/users/${id}`, { isBanned: !isBanned });
    load();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold">Users</h1>
      <table className="mt-6 w-full rounded-xl border bg-white text-sm">
        <thead className="bg-gray-50 text-left">
          <tr><th className="p-4">Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u._id} className="border-t">
              <td className="p-4">{u.name}</td>
              <td>{u.email}</td>
              <td>{u.role}</td>
              <td>{u.isBanned ? 'Banned' : 'Active'}</td>
              <td>
                <Button variant="outline" onClick={() => toggleBan(u._id, u.isBanned)}>
                  {u.isBanned ? 'Unban' : 'Ban'}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
