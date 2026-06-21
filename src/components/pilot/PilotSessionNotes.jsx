import React, { useEffect, useState } from 'react';
import { ClipboardPenLine, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const EMPTY_NOTES = {
  coachName: '',
  clubSquad: '',
  swimmerAlias: '',
  stroke: '',
  cameraAngle: '',
  confused: '',
  trusted: '',
  rejected: '',
  useAgain: '',
  saveTime: '',
  beforePaying: '',
};

function readLocalRecord(storageKey) {
  try {
    const value = window.localStorage.getItem(storageKey);
    return value ? { ...EMPTY_NOTES, ...JSON.parse(value) } : EMPTY_NOTES;
  } catch {
    return EMPTY_NOTES;
  }
}

export default function PilotSessionNotes({ storageKey, onSaved }) {
  const [notes, setNotes] = useState(EMPTY_NOTES);
  const [savedAt, setSavedAt] = useState('');
  const [storageError, setStorageError] = useState('');

  useEffect(() => {
    const stored = readLocalRecord(storageKey);
    setNotes(stored);
    setSavedAt(stored.savedAt || '');
  }, [storageKey]);

  const update = (field, value) => setNotes(current => ({ ...current, [field]: value }));

  const save = () => {
    const next = { ...notes, savedAt: new Date().toISOString() };
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(next));
      setNotes(next);
      setSavedAt(next.savedAt);
      setStorageError('');
      onSaved?.(next);
    } catch {
      setStorageError('This browser could not save the pilot notes. Keep the page open and record the feedback separately.');
    }
  };

  const clear = () => {
    try {
      window.localStorage.removeItem(storageKey);
      setNotes(EMPTY_NOTES);
      setSavedAt('');
      setStorageError('');
      onSaved?.(null);
    } catch {
      setStorageError('This browser could not clear the locally saved notes.');
    }
  };

  const fieldClass = 'h-11 border-slate-200 bg-white text-sm';
  const labelClass = 'mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500';

  return (
    <section id="session-notes" className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <ClipboardPenLine className="h-4 w-4 text-cyan-700" /> Pilot session notes
          </div>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-600">
            Use a swimmer alias only. Do not record guardian contacts or medical details. These notes stay in this browser and are not used to train the AI.
          </p>
        </div>
        {savedAt && <span className="text-[10px] text-emerald-700">Saved on this device</span>}
      </div>

      {storageError && <p className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">{storageError}</p>}

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label>
          <span className={labelClass}>Coach name</span>
          <Input className={fieldClass} value={notes.coachName} onChange={event => update('coachName', event.target.value)} placeholder="Coach running the test" />
        </label>
        <label>
          <span className={labelClass}>Club / squad</span>
          <Input className={fieldClass} value={notes.clubSquad} onChange={event => update('clubSquad', event.target.value)} placeholder="Club or squad context" />
        </label>
        <label>
          <span className={labelClass}>Swimmer alias only</span>
          <Input className={fieldClass} value={notes.swimmerAlias} onChange={event => update('swimmerAlias', event.target.value)} placeholder="Example: Swimmer A" />
        </label>
        <label>
          <span className={labelClass}>Stroke</span>
          <select className={`w-full rounded-md border px-3 ${fieldClass}`} value={notes.stroke} onChange={event => update('stroke', event.target.value)}>
            <option value="">Select stroke</option>
            <option value="Breaststroke">Breaststroke</option>
            <option value="Freestyle">Freestyle</option>
            <option value="Backstroke">Backstroke</option>
            <option value="Butterfly">Butterfly</option>
          </select>
        </label>
        <label className="sm:col-span-2">
          <span className={labelClass}>Camera angle</span>
          <select className={`w-full rounded-md border px-3 ${fieldClass}`} value={notes.cameraAngle} onChange={event => update('cameraAngle', event.target.value)}>
            <option value="">Select camera angle</option>
            <option value="Side">Side</option>
            <option value="Front">Front</option>
            <option value="Rear">Rear</option>
            <option value="Other">Other</option>
          </select>
        </label>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {[
          ['confused', 'What confused the coach?'],
          ['trusted', 'What did the coach trust?'],
          ['rejected', 'What did the coach reject?'],
          ['beforePaying', 'What would need to change before paying?'],
        ].map(([field, label]) => (
          <label key={field}>
            <span className={labelClass}>{label}</span>
            <Textarea
              className="min-h-24 border-slate-200 bg-white text-sm"
              value={notes[field]}
              onChange={event => update(field, event.target.value)}
              placeholder="Keep this focused on the workflow and report."
            />
          </label>
        ))}
        {[
          ['useAgain', 'Would they use this again?'],
          ['saveTime', 'Would this save time?'],
        ].map(([field, label]) => (
          <div key={field}>
            <span className={labelClass}>{label}</span>
            <div className="grid grid-cols-3 gap-2">
              {['Yes', 'No', 'Maybe'].map(option => (
                <button
                  key={option}
                  type="button"
                  onClick={() => update(field, option)}
                  className={`min-h-11 rounded-md border px-2 text-xs font-semibold ${
                    notes[field] === option
                      ? 'border-cyan-600 bg-cyan-50 text-cyan-800'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-cyan-300'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" className="min-h-11 text-xs" onClick={clear}>
          <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Clear local notes
        </Button>
        <Button type="button" className="min-h-11 bg-cyan-700 text-xs text-white hover:bg-cyan-800" onClick={save}>
          <Save className="mr-1.5 h-3.5 w-3.5" /> Save on this device
        </Button>
      </div>
    </section>
  );
}
