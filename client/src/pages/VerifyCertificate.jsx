import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Award, CheckCircle2, Search } from 'lucide-react';
import api from '../services/api';
import Button from '../components/Button';
import GlassCard from '../components/ui/GlassCard';

export default function VerifyCertificate() {
  const [params] = useSearchParams();
  const [certificateId, setCertificateId] = useState(params.get('id') || '');
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const verify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setResult(null);
    try {
      const { data } = await api.get(`/certificates/verify/${encodeURIComponent(certificateId.trim())}`);
      setResult(data.data);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Certificate not found');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <div className="mb-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-500 text-white">
          <Award className="h-8 w-8" />
        </div>
        <h1 className="mt-4 font-display text-3xl font-bold text-slate-900">Verify Certificate</h1>
        <p className="mt-2 text-slate-500">Enter a LearnHub certificate ID to confirm it was issued by the platform.</p>
      </div>

      <GlassCard className="p-6">
        <form onSubmit={verify} className="flex flex-col gap-3 sm:flex-row">
          <input
            value={certificateId}
            onChange={(e) => setCertificateId(e.target.value)}
            className="input-field"
            placeholder="Example: LH-1A2B3C4D"
            required
          />
          <Button type="submit" disabled={loading}>
            <Search className="mr-2 h-4 w-4" />
            Verify
          </Button>
        </form>

        {message && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{message}</p>}

        {result && (
          <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
            <p className="flex items-center gap-2 font-semibold text-emerald-700">
              <CheckCircle2 className="h-5 w-5" />
              Valid certificate
            </p>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-slate-500">Student</dt>
                <dd className="font-medium text-slate-900">{result.studentName}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Certificate ID</dt>
                <dd className="font-medium text-slate-900">{result.certificateId}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-slate-500">Course</dt>
                <dd className="font-medium text-slate-900">{result.courseTitle}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Instructor</dt>
                <dd className="font-medium text-slate-900">{result.instructorName}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Completed</dt>
                <dd className="font-medium text-slate-900">
                  {new Date(result.completedAt).toLocaleDateString()}
                </dd>
              </div>
            </dl>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
