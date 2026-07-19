import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Button from '../components/Button';

export default function BecomeInstructor() {
  const { user, refreshUser } = useAuth();
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const apply = async () => {
    setLoading(true);
    try {
      await api.post('/instructor/apply');
      await refreshUser();
      setMsg('Application submitted! Admin will review soon.');
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <h1 className="text-3xl font-bold">Become an Instructor</h1>
      <p className="mt-4 text-gray-600">Share your knowledge and earn on LearnHub.</p>
      {user?.instructorStatus === 'approved' ? (
        <p className="mt-6 text-green-600 font-medium">You are an approved instructor!</p>
      ) : user?.instructorStatus === 'pending' ? (
        <p className="mt-6 text-amber-600">Your application is pending approval.</p>
      ) : (
        <Button className="mt-8" onClick={apply} disabled={loading || !user}>
          {user ? (loading ? 'Submitting...' : 'Apply Now') : 'Login to Apply'}
        </Button>
      )}
      {msg && <p className="mt-4 text-sm text-gray-600">{msg}</p>}
    </div>
  );
}
