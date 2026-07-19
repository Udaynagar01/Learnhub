import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Tab } from '@headlessui/react';
import api from '../services/api';
import Button from '../components/Button';
import { resolveImageUrl } from '../utils/mediaUrl';
import { downloadProtectedFile, parseBlobError } from '../utils/downloadBlob';

export default function MyLearning({ defaultTab = 0 }) {
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const initialTab =
    tabFromUrl === 'wishlist' ? 1 : tabFromUrl === 'completed' ? 2 : defaultTab;
  const [tabIndex, setTabIndex] = useState(initialTab);
  const [enrolled, setEnrolled] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [completed, setCompleted] = useState([]);

  useEffect(() => {
    setTabIndex(initialTab);
  }, [initialTab]);

  useEffect(() => {
    api
      .get('/enrollments/my-learning')
      .then((r) => {
        setEnrolled(r.data.data.enrolled || []);
        setWishlist(r.data.data.wishlist || []);
        setCompleted(r.data.data.completed || []);
      })
      .catch(() => {
        setEnrolled([]);
        setWishlist([]);
        setCompleted([]);
      });
  }, []);

  const CourseRow = ({ item }) => {
    const course = item.courseId;
    const firstLesson = course?.sections?.[0]?.lessons?.[0];
    const thumbSrc = resolveImageUrl(course?.thumbnail);
    return (
      <div className="card flex gap-4 p-4 transition hover:shadow-soft">
        <div className="h-24 w-40 shrink-0 overflow-hidden rounded-lg bg-gray-200">
          {thumbSrc && <img src={thumbSrc} alt="" className="h-full w-full object-cover" />}
        </div>
        <div className="flex flex-1 flex-col justify-center">
          <h3 className="font-semibold">{course?.title}</h3>
          <div className="mt-2 h-2 w-full max-w-xs rounded-full bg-gray-200">
            <div
              className="h-2 rounded-full bg-primary-600"
              style={{ width: `${item.progressPercent || 0}%` }}
            />
          </div>
          <p className="mt-1 text-sm text-gray-500">{item.progressPercent || 0}% Complete</p>
        </div>
        {firstLesson && (
          <Link to={`/learn/${course._id}/${firstLesson._id}`}>
            <Button>Continue</Button>
          </Link>
        )}
      </div>
    );
  };

  const downloadCertificate = async (item) => {
    const slug = item.courseId?.slug || 'course';
    try {
      await downloadProtectedFile(`/certificates/${item._id}`, `${slug}-certificate.pdf`);
    } catch (err) {
      alert(await parseBlobError(err));
    }
  };

  return (
    <div>
      <h1 className="section-title">My Learning</h1>
      <p className="mt-1 text-slate-500">Track progress, wishlist, and certificates</p>
      <Tab.Group selectedIndex={tabIndex} onChange={setTabIndex} className="mt-6">
        <Tab.List className="flex gap-6 border-b border-slate-200">
          {['Enrolled', 'Wishlist', 'Completed'].map((t) => (
            <Tab
              key={t}
              className={({ selected }) =>
                `pb-3 text-sm font-semibold ${selected ? 'border-b-2 border-primary-500 text-primary-600' : 'text-slate-500'}`
              }
            >
              {t}
            </Tab>
          ))}
        </Tab.List>
        <Tab.Panels className="mt-6 space-y-4">
          <Tab.Panel>
            {enrolled.length === 0 ? (
              <p className="text-gray-500">No enrolled courses. <Link to="/courses" className="text-primary-600">Browse courses</Link></p>
            ) : (
              enrolled.map((item) => <CourseRow key={item._id} item={item} />)
            )}
          </Tab.Panel>
          <Tab.Panel>
            {wishlist.length === 0 ? (
              <p className="text-gray-500">Wishlist is empty.</p>
            ) : (
              wishlist.map((c) => (
                <Link
                  key={c._id}
                  to={`/courses/${c.slug}`}
                  className="card-hover block p-4"
                >
                  <p className="font-semibold text-slate-900">{c.title}</p>
                </Link>
              ))
            )}
          </Tab.Panel>
          <Tab.Panel>
            {completed.length === 0 ? (
              <p className="text-gray-500">No completed courses yet.</p>
            ) : (
              completed.map((item) => (
                <div key={item._id} className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{item.courseId?.title}</p>
                    {item.certificateId && (
                      <p className="mt-1 text-sm text-slate-500">
                        Certificate ID:{' '}
                        <span className="font-mono font-semibold text-slate-700">{item.certificateId}</span>
                      </p>
                    )}
                  </div>
                  {item.certificateId && (
                    <div className="flex flex-wrap gap-3">
                      <Link
                        to={`/verify-certificate?id=${encodeURIComponent(item.certificateId)}`}
                        className="text-sm font-medium text-primary-600 hover:underline"
                      >
                        Verify
                      </Link>
                      <button
                        type="button"
                        onClick={() => downloadCertificate(item)}
                        className="text-sm font-medium text-primary-600 hover:underline"
                      >
                        Download Certificate
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
}
