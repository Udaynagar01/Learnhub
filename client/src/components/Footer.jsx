import { Link } from 'react-router-dom';
import { GraduationCap, Twitter, Linkedin, Youtube } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-12 border-t border-slate-100 bg-surface-subtle dark:border-slate-800 dark:bg-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold text-primary-600">
              <GraduationCap className="h-8 w-8" />
              LearnHub
            </Link>
            <p className="mt-3 text-sm text-slate-500">
              The best place to learn, grow, and teach. Expert-led courses for every skill level.
            </p>
            <div className="mt-4 flex gap-3">
              {[Twitter, Linkedin, Youtube].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="rounded-lg bg-slate-100 p-2 text-slate-500 transition hover:bg-primary-50 hover:text-primary-600"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900">Platform</h4>
            <ul className="mt-3 space-y-2 text-sm text-slate-500">
              <li><Link to="/about" className="hover:text-primary-600">About</Link></li>
              <li><Link to="/courses" className="hover:text-primary-600">Browse Courses</Link></li>
              <li><Link to="/become-instructor" className="hover:text-primary-600">Become Instructor</Link></li>
              <li><Link to="/dashboard/learning" className="hover:text-primary-600">My Learning</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900">Support</h4>
            <ul className="mt-3 space-y-2 text-sm text-slate-500">
              <li><Link to="/contact" className="hover:text-primary-600">Contact</Link></li>
              <li><Link to="/help-center" className="hover:text-primary-600">Help Center</Link></li>
              <li><Link to="/terms-of-service" className="hover:text-primary-600">Terms of Service</Link></li>
              <li><Link to="/privacy-policy" className="hover:text-primary-600">Privacy Policy</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900">Contact</h4>
            <p className="mt-3 text-sm text-slate-500">support@learnhub.com</p>
          </div>
        </div>
        <p className="mt-10 border-t border-slate-100 pt-6 text-center text-sm text-slate-400">
          © {new Date().getFullYear()} LearnHub. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
