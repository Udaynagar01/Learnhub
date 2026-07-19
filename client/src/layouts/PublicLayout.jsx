import Navbar from '../components/Navbar';
import PublicSidebar from '../components/PublicSidebar';
import Footer from '../components/Footer';
import PageTransition from '../components/PageTransition';

export default function PublicLayout() {
  return (
    <div className="flex min-h-screen bg-white dark:bg-slate-950">
      <PublicSidebar />
      <div className="flex min-w-0 flex-1 flex-col bg-white dark:bg-slate-950">
        <Navbar />
        <main className="flex-1">
          <PageTransition />
        </main>
        <Footer />
      </div>
    </div>
  );
}
