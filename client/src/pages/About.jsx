import { Award, BookOpen, GraduationCap, Users } from 'lucide-react';

const stats = [
  { label: 'Courses', value: '50+', icon: BookOpen },
  { label: 'Learners', value: '10k+', icon: Users },
  { label: 'Certificates', value: '2k+', icon: Award },
];

export default function About() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-3xl">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-500 text-white">
          <GraduationCap className="h-7 w-7" />
        </div>
        <h1 className="mt-5 font-display text-4xl font-bold text-slate-900 dark:text-white">
          About LearnHub
        </h1>
        <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">
          LearnHub is an online learning platform built for students, instructors, and admins.
          Learners can enroll in courses, track progress, ask questions, complete quizzes, and earn certificates.
        </p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <Icon className="h-6 w-6 text-primary-500" />
            <p className="mt-4 text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
          </div>
        ))}
      </div>

      <section className="mt-12 grid gap-6 md:grid-cols-2">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">For learners</h2>
          <p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">
            LearnHub helps students continue lessons from where they stopped, save notes,
            use Q&A, complete quizzes, and verify certificates publicly.
          </p>
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">For instructors</h2>
          <p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">
            Instructors can create courses, upload videos, manage quizzes, view students,
            post announcements, and communicate with learners.
          </p>
        </div>
      </section>
    </div>
  );
}
