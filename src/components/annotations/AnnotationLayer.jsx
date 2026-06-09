import React from 'react';

function pathFrom(points = []) {
  return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
}

function ArrowHead({ shape }) {
  const points = shape.points || [];
  if (points.length < 2) return null;
  const end = points[points.length - 1];
  const start = points[points.length - 2];
  const angle = Math.atan2(end.y - start.y, end.x - start.x);
  const size = Math.max(10, Number(shape.size || 4) * 3);
  const a1 = angle - Math.PI / 7;
  const a2 = angle + Math.PI / 7;
  const p1 = { x: end.x - size * Math.cos(a1), y: end.y - size * Math.sin(a1) };
  const p2 = { x: end.x - size * Math.cos(a2), y: end.y - size * Math.sin(a2) };
  return (
    <path
      d={`M ${p1.x} ${p1.y} L ${end.x} ${end.y} L ${p2.x} ${p2.y}`}
      fill="none"
      stroke={shape.color}
      strokeWidth={shape.size}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}

function Shape({ shape }) {
  const points = shape.points || [];
  const common = {
    fill: 'none',
    stroke: shape.color || '#22d3ee',
    strokeWidth: shape.size || 4,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  };

  if (shape.tool === 'text') {
    const point = points[0] || { x: 24, y: 32 };
    return (
      <text
        x={point.x}
        y={point.y}
        fill={shape.color || '#22d3ee'}
        fontSize={Math.max(18, (shape.size || 4) * 5)}
        fontFamily="Arial, sans-serif"
        fontWeight="700"
      >
        {shape.text || 'Coach note'}
      </text>
    );
  }

  if (shape.tool === 'ellipse' || shape.tool === 'circle') {
    const start = points[0] || { x: 0, y: 0 };
    const end = points[1] || start;
    return (
      <ellipse
        cx={(start.x + end.x) / 2}
        cy={(start.y + end.y) / 2}
        rx={Math.abs(end.x - start.x) / 2}
        ry={Math.abs(end.y - start.y) / 2}
        {...common}
      />
    );
  }

  if (shape.tool === 'body_line') {
    return <path d={pathFrom(points)} {...common} strokeWidth={Math.max(shape.size || 4, 6)} strokeDasharray="16 10" />;
  }

  const element = <path d={pathFrom(points)} {...common} />;
  return (
    <>
      {element}
      {shape.tool === 'arrow' && <ArrowHead shape={shape} />}
    </>
  );
}

export default function AnnotationLayer({ shapes = [], width, height, className = '' }) {
  return (
    <svg
      className={className}
      viewBox={`0 0 ${width || 1280} ${height || 720}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {shapes.map((shape) => <Shape key={shape.id} shape={shape} />)}
    </svg>
  );
}
