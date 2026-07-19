import { useEffect, useState } from 'react';
import api from '../../services/api';
import Button from '../../components/Button';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('book');

  const load = () => api.get('/admin/categories').then((r) => setCategories(r.data.data));

  useEffect(() => {
    load();
  }, []);

  const add = async (e) => {
    e.preventDefault();
    await api.post('/admin/categories', { name, icon });
    setName('');
    load();
  };

  const remove = async (id) => {
    if (!confirm('Delete category?')) return;
    try {
      await api.delete(`/admin/categories/${id}`);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Cannot delete');
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold">Categories</h1>
      <form onSubmit={add} className="mt-6 flex flex-wrap gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Category name"
          className="rounded border px-3 py-2"
          required
        />
        <input
          value={icon}
          onChange={(e) => setIcon(e.target.value)}
          placeholder="icon key"
          className="w-32 rounded border px-3 py-2"
        />
        <Button type="submit">Add</Button>
      </form>
      <table className="mt-8 w-full rounded-xl border bg-white text-sm">
        <thead className="bg-gray-50 text-left">
          <tr>
            <th className="p-4">Name</th>
            <th>Slug</th>
            <th>Courses</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {categories.map((c) => (
            <tr key={c._id} className="border-t">
              <td className="p-4 font-medium">{c.name}</td>
              <td className="text-gray-500">{c.slug}</td>
              <td>{c.courseCount}</td>
              <td className="p-4">
                <button type="button" onClick={() => remove(c._id)} className="text-red-600 text-sm">
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
