import React from 'react';
import { Button } from '@/components/ui/button';
import {
  PenLine, Slash, MoveRight, Circle, Type, RotateCcw, RotateCw,
  Trash2, Save, X, Ruler, Activity
} from 'lucide-react';

const TOOLS = [
  { id: 'pen', label: 'Pen', icon: PenLine },
  { id: 'line', label: 'Line', icon: Slash },
  { id: 'arrow', label: 'Arrow', icon: MoveRight },
  { id: 'ellipse', label: 'Circle', icon: Circle },
  { id: 'angle', label: 'Angle', icon: Ruler },
  { id: 'body_line', label: 'Body line', icon: Activity },
  { id: 'text', label: 'Text', icon: Type },
];

const COLORS = ['#22d3ee', '#facc15', '#fb7185', '#34d399', '#ffffff', '#111827'];
const SIZES = [3, 5, 8, 12];

export default function AnnotationToolbar({
  tool,
  color,
  size,
  onToolChange,
  onColorChange,
  onSizeChange,
  onUndo,
  onRedo,
  onClear,
  onSave,
  onCancel,
  canUndo,
  canRedo,
  saving,
}) {
  return (
    <div className="rounded-xl bg-slate-950/95 border border-white/10 text-white shadow-xl p-3 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-xs font-bold">Coach Draw</div>
          <div className="text-[10px] text-slate-300">Pause, mark frame, save annotation</div>
        </div>
        <Button size="icon" variant="ghost" className="h-8 w-8 text-white hover:bg-white/10" onClick={onCancel}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
        {TOOLS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onToolChange(id)}
            className={`min-h-11 rounded-lg border px-2 py-1.5 text-[10px] font-semibold flex flex-col items-center justify-center gap-1 ${
              tool === id ? 'bg-cyan-500 text-slate-950 border-cyan-300' : 'bg-white/5 text-slate-200 border-white/10'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5">
          {COLORS.map(item => (
            <button
              key={item}
              type="button"
              onClick={() => onColorChange(item)}
              className={`w-8 h-8 rounded-full border-2 ${color === item ? 'border-white' : 'border-white/20'}`}
              style={{ backgroundColor: item }}
              aria-label={`Use ${item}`}
            />
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          {SIZES.map(item => (
            <button
              key={item}
              type="button"
              onClick={() => onSizeChange(item)}
              className={`h-8 w-10 rounded-lg border text-xs font-bold ${size === item ? 'bg-white text-slate-950 border-white' : 'bg-white/5 text-white border-white/10'}`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" className="h-9 text-xs bg-white/5 border-white/10 text-white hover:bg-white/10" onClick={onUndo} disabled={!canUndo}>
          <RotateCcw className="w-3.5 h-3.5 mr-1" />Undo
        </Button>
        <Button size="sm" variant="outline" className="h-9 text-xs bg-white/5 border-white/10 text-white hover:bg-white/10" onClick={onRedo} disabled={!canRedo}>
          <RotateCw className="w-3.5 h-3.5 mr-1" />Redo
        </Button>
        <Button size="sm" variant="outline" className="h-9 text-xs bg-white/5 border-white/10 text-white hover:bg-white/10" onClick={onClear}>
          <Trash2 className="w-3.5 h-3.5 mr-1" />Clear
        </Button>
        <Button size="sm" className="h-9 text-xs bg-cyan-500 text-slate-950 hover:bg-cyan-400 ml-auto" onClick={onSave} disabled={saving}>
          <Save className="w-3.5 h-3.5 mr-1" />{saving ? 'Saving...' : 'Save Annotation'}
        </Button>
      </div>
    </div>
  );
}
