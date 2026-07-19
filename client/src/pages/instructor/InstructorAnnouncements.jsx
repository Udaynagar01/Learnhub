import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Megaphone } from 'lucide-react';
import api from '../../services/api';
import CourseAnnouncements from '../../components/CourseAnnouncements';

export default function InstructorAnnouncements() {
  const [params] = useSearchParams();
  const [courses, setCourses] = useState([]);
  const [selectedId, setSelectedId] = useState('');

  useEffect(() => {
    api.get('/instructor/courses').then((r) => {
      const list = r.data.data || [];
      const courseFromUrl = params.get('course');
      setCourses(list);
      setSelectedId((current) => {
        if (current && list.some((course) => course._id === current)) return current;
        if (courseFromUrl && list.some((course) => course._id === courseFromUrl)) return courseFromUrl;
        return list[0]?._id || '';
      });
    });
  }, [params]);

  const selectedCourse = courses.find((course) => course._id === selectedId);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="section-title">Course Announcements</h1>
          <p className="mt-1 text-slate-500">
            Share updates with enrolled students and notify them instantly.
          </p>
        </div>
        {courses.length > 0 && (
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="input-field max-w-sm"
          >
            {courses.map((course) => (
              <option key={course._id} value={course._id}>
                {course.title}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="mt-6 max-w-3xl">
        {selectedCourse ? (
          <>
            {!selectedCourse.sections?.some((section) => section.lessons?.length) && (
              <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                Add at least one lesson to this course before posting announcements.
              </p>
            )}
            <CourseAnnouncements course={selectedCourse} />
          </>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-slate-500">
            <Megaphone className="mx-auto mb-3 h-8 w-8 text-slate-400" />
            Create a course first, then post announcements here.
          </div>
        )}
      </div>
    </div>
  );
}
