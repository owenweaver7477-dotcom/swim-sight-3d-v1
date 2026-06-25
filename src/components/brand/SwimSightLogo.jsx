import React from 'react';
import { Link } from 'react-router-dom';

export const SWIM_SIGHT_LOGO_LIGHT = '/brand/swim-sight-3d-logo-light.png';

function BrandMark({ size = 'md', className = '' }) {
  const sizeClass = size === 'sm' ? 'h-8 w-8' : size === 'lg' ? 'h-12 w-12' : 'h-10 w-10';

  return (
    <span
      className={`${sizeClass} relative inline-flex flex-shrink-0 overflow-hidden rounded-xl border border-sky-300/25 bg-white shadow-lg shadow-sky-950/20 ${className}`}
      aria-hidden="true"
    >
      <img
        src={SWIM_SIGHT_LOGO_LIGHT}
        alt=""
        className="h-full w-full scale-[1.55] object-cover"
        style={{ objectPosition: '50% 34%' }}
      />
    </span>
  );
}

function LogoText({ tone = 'dark', compact = false }) {
  const headingClass = tone === 'light' ? 'text-white' : 'text-slate-950';
  const subClass = tone === 'light' ? 'text-cyan-100/70' : 'text-slate-500';

  return (
    <span className="min-w-0">
      <span className={`block truncate text-sm font-extrabold uppercase leading-tight tracking-[0.08em] ${headingClass}`}>
        Swim Sight <span className={tone === 'light' ? 'text-sky-300' : 'text-sky-600'}>3D</span>
      </span>
      {!compact && (
        <span className={`block truncate text-[9px] font-semibold uppercase tracking-[0.24em] ${subClass}`}>
          Performance Analysis
        </span>
      )}
    </span>
  );
}

export default function SwimSightLogo({
  to,
  tone = 'dark',
  size = 'md',
  compact = false,
  className = '',
  label = 'Swim Sight 3D home',
}) {
  const content = (
    <>
      <BrandMark size={size} />
      <LogoText tone={tone} compact={compact} />
    </>
  );

  const baseClass = `inline-flex min-w-0 items-center gap-2.5 ${className}`;

  if (to) {
    return (
      <Link to={to} className={baseClass} aria-label={label}>
        {content}
      </Link>
    );
  }

  return (
    <div className={baseClass} aria-label="Swim Sight 3D">
      {content}
    </div>
  );
}
