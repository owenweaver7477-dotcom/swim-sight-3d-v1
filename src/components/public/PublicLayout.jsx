import React from 'react';
import PublicFooter from './PublicFooter';
import PublicNav from './PublicNav';

export default function PublicLayout({ children }) {
  return (
    <div className="min-h-screen bg-white text-slate-950">
      <PublicNav />
      <main>{children}</main>
      <PublicFooter />
    </div>
  );
}

export function PublicHero({ eyebrow, title, description, actions, children }) {
  return (
    <section className="border-b border-slate-200 bg-[radial-gradient(circle_at_20%_0%,rgba(14,165,233,0.12),transparent_34%),linear-gradient(180deg,#ffffff,#f8fafc)]">
      <div className={`mx-auto grid max-w-6xl gap-10 px-4 py-16 md:py-20 ${children ? 'md:grid-cols-[1.1fr_0.9fr]' : ''}`}>
        <div>
          {eyebrow && <div className="text-xs font-bold uppercase tracking-[0.24em] text-sky-600">{eyebrow}</div>}
          <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight text-slate-950 md:text-6xl">{title}</h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 md:text-lg">{description}</p>
          {actions && <div className="mt-8 flex flex-wrap gap-3">{actions}</div>}
        </div>
        {children && <div className="md:pt-4">{children}</div>}
      </div>
    </section>
  );
}

export function PublicSection({ eyebrow, title, description, children, subtle = false }) {
  return (
    <section className={`border-b border-slate-200 px-4 py-14 ${subtle ? 'bg-slate-50' : 'bg-white'}`}>
      <div className="mx-auto max-w-6xl">
        {(eyebrow || title || description) && (
          <div className="mb-8 max-w-3xl">
            {eyebrow && <div className="text-xs font-bold uppercase tracking-[0.24em] text-sky-600">{eyebrow}</div>}
            {title && <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-950 md:text-3xl">{title}</h2>}
            {description && <p className="mt-3 text-sm leading-7 text-slate-600 md:text-base">{description}</p>}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}

export function PublicCard({ title, description, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/5">
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
