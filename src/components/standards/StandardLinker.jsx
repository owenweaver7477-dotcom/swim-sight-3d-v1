/**
 * StandardLinker
 * Allows a coach to search and link a TechnicalStandard to a finding, drag item, or annotation.
 * Usage: <StandardLinker clubId={...} value={standardId} onChange={id => ...} />
 */
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { DEFAULT_STANDARDS } from './defaultStandards';
import { BookMarked, Search, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function StandardLinker({ clubId, value, onChange, label = 'Linked Technical Standard' }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const { data: clubStandards = [] } = useQuery({
    queryKey: ['technical-standards', clubId],
    queryFn: () => base44.entities.TechnicalStandard.filter({ club_id: clubId, is_active: true }),
    enabled: !!clubId,
    staleTime: 5 * 60 * 1000,
  });

  // Combine club + defaults
  const allStandards = useMemo(() => {
    const defaults = DEFAULT_STANDARDS.map(s => ({ ...s, id: `default_${s.title}`, _isDefault: true }));
    const club = clubStandards.map(s => ({ ...s, _isDefault: false }));
    return [...club, ...defaults];
  }, [clubStandards]);

  const linkedStandard = value ? allStandards.find(s => s.id === value || s.title === value) : null;

  const filtered = useMemo(() => {
    if (!search) return allStandards.slice(0, 20);
    const q = search.toLowerCase();
    return allStandards.filter(s =>
      s.title?.toLowerCase().includes(q) ||
      s.stroke?.toLowerCase().includes(q) ||
      s.phase?.toLowerCase().includes(q)
    ).slice(0, 20);
  }, [allStandards, search]);

  const handleSelect = (standard) => {
    onChange(standard.id, standard.title);
    setOpen(false);
    setSearch('');
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange(null, null);
  };

  return (
    <div className="space-y-1.5">
      <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
        <BookMarked className="w-3 h-3" />
        {label}
      </div>

      {linkedStandard ? (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/20">
          <BookMarked className="w-3 h-3 text-primary flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-primary truncate">{linkedStandard.title}</div>
            <div className="text-[10px] text-slate-400">{linkedStandard.stroke} · {linkedStandard.phase}</div>
          </div>
          <button onClick={handleClear} className="p-0.5 hover:text-red-500 text-slate-400 transition-colors">
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-slate-300 hover:border-primary/40 transition-colors text-xs text-slate-400 hover:text-primary"
        >
          <BookMarked className="w-3 h-3" />
          <span className="flex-1 text-left">Link a technical standard…</span>
          {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      )}

      {open && (
        <div className="border border-slate-200 rounded-xl bg-white shadow-lg overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search standards…"
                className="pl-6 h-7 text-xs bg-slate-50 border-slate-200"
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 && (
              <div className="py-4 text-center text-xs text-slate-400">No standards found</div>
            )}
            {filtered.map(s => (
              <button
                key={s.id}
                type="button"
                onClick={() => handleSelect(s)}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
              >
                <div className="flex items-start gap-2">
                  {s._isDefault && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-200 flex-shrink-0 mt-0.5">
                      Default
                    </span>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-slate-800 truncate">{s.title}</div>
                    <div className="text-[10px] text-slate-400">{s.stroke} · {s.phase}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
          <div className="p-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-[10px] text-slate-400 hover:text-slate-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}