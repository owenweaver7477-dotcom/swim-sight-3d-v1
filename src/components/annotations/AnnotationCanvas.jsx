import React, { useRef, useState } from 'react';
import AnnotationLayer from './AnnotationLayer';
import AnnotationToolbar from './AnnotationToolbar';

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

  const begin = (event) => {
    if (!surfaceRef.current || event.button === 2) return;
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
        className="absolute inset-0 touch-none cursor-crosshair"
        style={{ touchAction: 'none' }}
        onPointerDown={begin}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
      >
        <AnnotationLayer shapes={displayShapes} width={surfaceRef.current?.clientWidth || 1280} height={surfaceRef.current?.clientHeight || 720} className="w-full h-full pointer-events-none" />
      </div>

      <div className="absolute left-3 right-3 bottom-3 z-30 max-h-[48%] overflow-y-auto rounded-xl md:left-auto md:top-3 md:bottom-3 md:w-[min(320px,calc(100%-1.5rem))] md:max-h-none">
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
          canUndo={shapes.length > 0}
          canRedo={redo.length > 0}
          canSave={shapes.length > 0}
          saving={saving}
        />
        <div className="mt-2 text-[10px] text-white/80 bg-black/40 rounded-lg px-2 py-1 w-fit">
          Marking frame at {Number(timestampSeconds || 0).toFixed(1)}s. Finger, mouse, and stylus input supported.
        </div>
      </div>
    </div>
  );
}
