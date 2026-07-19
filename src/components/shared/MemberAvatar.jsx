import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

// Profile picture for an app member (coach / owner / admin / parent). The photo
// lives in the private `member-avatars` bucket, so we fetch a short-lived signed
// URL; with no photo it falls back to a flat initial. See migration 025.
const AVATAR_BUCKET = 'member-avatars';

const SIZES = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-[11px]',
  md: 'h-10 w-10 text-sm',
  lg: 'h-16 w-16 text-lg',
  xl: 'h-24 w-24 text-2xl',
};

export default function MemberAvatar({ name, path, size = 'md', className = '' }) {
  const [url, setUrl] = useState('');

  useEffect(() => {
    let cancelled = false;
    if (!path) { setUrl(''); return () => { cancelled = true; }; }
    supabase.storage.from(AVATAR_BUCKET).createSignedUrl(path, 3600).then(({ data }) => {
      if (!cancelled) setUrl(data?.signedUrl || '');
    }).catch(() => { if (!cancelled) setUrl(''); });
    return () => { cancelled = true; };
  }, [path]);

  const initial = (name || '?').trim().charAt(0).toUpperCase() || '?';
  const cls = `flex flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 font-bold text-primary ${SIZES[size] || SIZES.md} ${className}`;

  if (url) {
    return (
      <span className={cls}>
        <img src={url} alt="" className="h-full w-full object-cover" />
      </span>
    );
  }
  return <span className={cls} aria-hidden="true">{initial}</span>;
}
