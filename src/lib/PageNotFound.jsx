import { useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function PageNotFound() {
  useEffect(() => {
    document.title = 'Page Not Found | Swim Sight 3D';
    let robots = document.head.querySelector('meta[name="robots"]');
    if (!robots) {
      robots = document.createElement('meta');
      robots.setAttribute('name', 'robots');
      document.head.appendChild(robots);
    }
    robots.setAttribute('content', 'noindex,nofollow');
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-16 text-white">
      <div className="mx-auto flex min-h-[70vh] max-w-3xl flex-col justify-center">
        <div className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-200">Swim Sight 3D</div>
        <h1 className="mt-5 text-4xl font-bold tracking-tight md:text-6xl">Page not found</h1>
        <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300">
          The page may have moved, or the link may be incorrect. You can return to Swim Sight 3D or view a sample swimming analysis report.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/" className="rounded-full bg-cyan-200 px-5 py-3 text-sm font-bold text-slate-950 hover:bg-cyan-100">
            Return home
          </Link>
          <Link to="/sample-report" className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10">
            View sample report
          </Link>
          <Link to="/login" className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10">
            Log in
          </Link>
        </div>
      </div>
    </main>
  );
}
