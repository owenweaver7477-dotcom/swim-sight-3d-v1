import React, { useRef, useState } from 'react';
import AnnotationLayer from './AnnotationLayer';
import AnnotationToolbar from './AnnotationToolbar';
import { Button } from '@/components/ui/button';
import { Eye, Save, X } from 'lucide-react';

function pointFromEvent(event, element) {
  const rect = element.getBoundingClientRect();
  return {
    x: Math.max(0, Math.min(rect.width, event.clientX - rect.left)),
    y: Math.max(0, Math.min(rect.height, event.clientY - rect.top)),
  };
}

function shapeFrom(tool, points, color, size) {
  const id = crypto.randomUUID();
  if (tool === 'text') {
    const text = window.prompt('Text label for this annotation', 'Coach note');
    if (!text) return null;
    return { id, tool, points: [points[0]], color, size, text };
  }
  if (['line', 'arrow', 'ellipse', 'body_line'].includes(tool)) {
    return { id, tool, points: [points[0], points[points.length - 1]], color, size };
  }
  if (tool === 'angle') {
    const start = points[0];
    const end = points[points.length - 1];
    const mid = { x: (start.x + end.x) / 2, y: Math.max(0, Math.min(start.y, end.y) - 42) };
    return { id, tool, points: [start, mid, end], color, size };
  }
  return { id, tool: 'pen', points, color, size };
}

export default function AnnotationCanvas({ timestampSeconds, onSave, onCancel, saving }) {
  const surfaceRef = useRef(null);
  const [tool, setTool] = useState('pen');
  const [color, setColor] = useState('#22d3ee');
  const [size, setSize] = useState(5);
  const [shapes, setShapes] = useState([]);
  const [redo, setRedo] = useState([]);
  const [activePoints, setActivePoints] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [toolsVisible, setToolsVisible] = useState(true);

  const begin = (event) => {
    if (!surfaceRef.current || event.button === 2 || tool === 'select') return;
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setIsDrawing(true);
    setActivePoints([pointFromEvent(event, surfaceRef.current)]);
  };

  const move = (event) => {
    if (!isDrawing || !surfaceRef.current) return;
    event.preventDefault();
    const next = pointFromEvent(event, surfaceRef.current);
    setActivePoints(prev => {
      if (tool === 'pen') return [...prev, next];
      return [prev[0], next];
    });
  };

  const end = (event) => {
    if (!isDrawing) return;
    event.preventDefault();
    setIsDrawing(false);
    const shape = shapeFrom(tool, activePoints, color, size);
    if (shape) {
      setShapes(prev => [...prev, shape]);
      setRedo([]);
    }
    setActivePoints([]);
  };

  const undo = () => {
    setShapes(prev => {
      if (!prev.length) return prev;
      const next = prev.slice(0, -1);
      setRedo(items => [prev[prev.length - 1], ...items]);
      return next;
    });
  };

  const redoOne = () => {
    setRedo(prev => {
      if (!prev.length) return prev;
      const [first, ...rest] = prev;
      setShapes(items => [...items, first]);
      return rest;
    });
  };

  const clear = () => {
    if (!shapes.length) return;
    setRedo(shapes);
    setShapes([]);
  };

  const save = () => {
    if (!shapes.length) return;
    const rect = surfaceRef.current?.getBoundingClientRect();
    const canvasWidth = Math.round(rect?.width || 1280);
    const canvasHeight = Math.round(rect?.height || 720);
    onSave({
      canvas_width: canvasWidth,
      canvas_height: canvasHeight,
      shapes,
      created_with: 'coach_draw',
    });
  };

  const previewShape = activePoints.length ? shapeFrom(tool === 'text' ? 'pen' : tool, activePoints, color, size) : null;
  const displayShapes = previewShape ? [...shapes, previewShape] : shapes;

  return (
    <div className="absolute inset-0 z-20 bg-transparent">
      <div
        ref={surfaceRef}
        className={`absolute inset-0 touch-none ${tool === 'select' ? 'cursor-default' : 'cursor-crosshair'}`}
        style={{ touchAction: 'none' }}
        onPointerDown={begin}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
      >
        <AnnotationLayer shapes={displayShapes} width={surfaceRef.current?.clientWidth || 1280} height={surfaceRef.current?.clientHeight || 720} className="w-full h-full pointer-events-none" />
      </div>

      <div className="absolute left-2 right-2 bottom-2 z-30 max-h-[45vh] overflow-y-auto sm:max-h-[42%] md:left-3 md:right-auto md:top-3 md:bottom-auto md:w-[min(340px,calc(100%-1.5rem))] md:max-h-[calc(100%-1.5rem)]">
        {toolsVisible ? (
          <AnnotationToolbar
            tool={tool}
            color={color}
            size={size}
            onToolChange={setTool}
            onColorChange={setColor}
            onSizeChange={setSize}
            onUndo={undo}
            onRedo={redoOne}
            onClear={clear}
            onSave={save}
            onCancel={onCancel}
            onHide={() => setToolsVisible(false)}
            canUndo={shapes.length > 0}
            canRedo={redo.length > 0}
            canSave={shapes.length > 0}
            saving={saving}
          />
        ) : (
          <div className="flex flex-wrap justify-end gap-2 rounded-lg border border-white/10 bg-slate-950/90 p-2 text-white shadow-xl">
            <Button size="sm" variant="outline" className="h-9 border-white/15 bg-white/5 text-xs text-white hover:bg-white/10" onClick={() => setToolsVisible(true)}>
              <Eye className="mr-1 h-3.5 w-3.5" /> Show drawing tools
            </Button>
            <Button size="sm" className="h-9 bg-cyan-500 text-xs text-slate-950 hover:bg-cyan-400" onClick={save} disabled={saving || !shapes.length}>
              <Save className="mr-1 h-3.5 w-3.5" /> {saving ? 'Saving…' : 'Save Drawing'}
            </Button>
            <Button size="icon" variant="ghost" className="h-9 w-9 text-white hover:bg-white/10" onClick={onCancel} title="Exit annotation mode" aria-label="Exit annotation mode">
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        <div className="mt-1.5 w-fit rounded-md bg-black/55 px-2 py-1 text-[9px] text-white/80">
          Coach annotation mode · {Number(timestampSeconds || 0).toFixed(1)}s · finger, stylus, or mouse
        </div>
      </div>
    </div>
  );
}
