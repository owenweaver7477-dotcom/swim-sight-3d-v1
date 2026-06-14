import React from 'react';

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card/50 py-6 px-4">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="w-5 h-5 rounded bg-primary/20 flex items-center justify-center">
            <span className="text-primary font-bold text-[8px]">SS</span>
          </div>
          <span>Swim Sight 3D</span>
          <span className="text-border">·</span>
          <span>Coach-Led Swim Review</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
            <span>Supabase + Render connected</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
