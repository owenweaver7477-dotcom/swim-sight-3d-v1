import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import PublicFooter from './PublicFooter';
import PublicNav from './PublicNav';

export default function PublicLayout({ children }) {
  const rootRef = useRef(null);
  const { pathname } = useLocation();

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const els = Array.from(root.querySelectorAll('.reveal'));
    if (typeof IntersectionObserver === 'undefined') {
      els.forEach((el) => el.classList.add('is-visible'));
      return undefined;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    );
    els.forEach((el) => {
      const sibs = el.parentElement
        ? Array.from(el.parentElement.children).filter((c) => c.classList.contains('reveal'))
        : [];
      el.style.transitionDelay = `${Math.min(Math.max(0, sibs.indexOf(el)) * 70, 350)}ms`;
      io.observe(el);
    });
    return () => io.disconnect();
  }, [pathname]);

  return (
    <div ref={rootRef} className="min-h-screen overflow-x-hidden bg-white text-slate-950">
      <PublicNav />
      <main>{children}</main>
      <PublicFooter />
    </div>
  );
}

export function PublicHero({ eyebrow, title, description, actions, children }) {
  return (
    <section className="border-b border-slate-200 bg-[radial-gradient(circle_at_20%_0%,rgba(14,165,233,0.12),transparent_34%),linear-gradient(180deg,#ffffff,#f8fafc)]">
      <div className={`mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:py-16 md:py-20 ${children ? 'md:grid-cols-[1.1fr_0.9fr]' : ''}`}>
        <div>
          {eyebrow && <div className="reveal text-xs font-bold uppercase tracking-[0.24em] text-sky-600">{eyebrow}</div>}
          <h1 className="reveal mt-4 max-w-3xl text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl md:text-6xl">{title}</h1>
          <p className="reveal mt-5 max-w-2xl text-base leading-8 text-slate-600 md:text-lg">{description}</p>
          {actions && <div className="reveal mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">{actions}</div>}
        </div>
        {children && <div className="md:pt-4">{children}</div>}
      </div>
    </section>
  );
}

export function PublicSection({ eyebrow, title, description, children, subtle = false, id }) {
  return (
    <section id={id} className={`border-b border-slate-200 px-4 py-12 sm:py-14 ${subtle ? 'bg-slate-50' : 'bg-white'}`}>
      <div className="mx-auto max-w-6xl">
        {(eyebrow || title || description) && (
          <div className="mb-8 max-w-3xl">
            {eyebrow && <div className="reveal text-xs font-bold uppercase tracking-[0.24em] text-sky-600">{eyebrow}</div>}
            {title && <h2 className="reveal mt-3 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{title}</h2>}
            {description && <p className="reveal mt-3 text-sm leading-7 text-slate-600 md:text-base">{description}</p>}
          </div>
        )}
        <div className="reveal">{children}</div>
      </div>
    </section>
  );
}

export function PublicCard({ title, description, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/5 transition-colors hover:border-slate-300">
      <h3 className="text-base font-bold text-slate-950">{title}</h3>
      {description && <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}

export function PrimaryPublicLink({ to, children }) {
  return (
    <a href={to} className="inline-flex items-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-950/15 transition-colors hover:bg-slate-800">
      {children}
    </a>
  );
}

export function SecondaryPublicLink({ to, children }) {
  return (
    <a href={to} className="inline-flex items-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition-colors hover:border-slate-400 hover:bg-slate-50">
      {children}
    </a>
  );
}
