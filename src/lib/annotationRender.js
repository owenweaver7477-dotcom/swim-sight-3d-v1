export function formatTimestamp(seconds = 0) {
  const total = Math.max(0, Number(seconds) || 0);
  const mins = Math.floor(total / 60);
  const secs = total - mins * 60;
  return `${mins}:${secs.toFixed(1).padStart(4, '0')}`;
}

function esc(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function pointsPath(points = []) {
  if (!points.length) return '';
  return points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${Number(point.x || 0).toFixed(1)} ${Number(point.y || 0).toFixed(1)}`)
    .join(' ');
}

function arrowHead(shape) {
  const points = shape.points || [];
  if (points.length < 2) return '';
  const end = points[points.length - 1];
  const start = points[points.length - 2];
  const angle = Math.atan2(end.y - start.y, end.x - start.x);
  const size = Math.max(10, Number(shape.size || 4) * 3);
  const a1 = angle - Math.PI / 7;
  const a2 = angle + Math.PI / 7;
  const p1 = { x: end.x - size * Math.cos(a1), y: end.y - size * Math.sin(a1) };
  const p2 = { x: end.x - size * Math.cos(a2), y: end.y - size * Math.sin(a2) };
  return `<path d="M ${p1.x.toFixed(1)} ${p1.y.toFixed(1)} L ${end.x.toFixed(1)} ${end.y.toFixed(1)} L ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}" fill="none" stroke="${esc(shape.color)}" stroke-width="${Number(shape.size || 4)}" stroke-linecap="round" stroke-linejoin="round" />`;
}

export function drawingToSvg(drawingData = {}, options = {}) {
  const width = Number(drawingData.canvas_width || options.width || 1280);
  const height = Number(drawingData.canvas_height || options.height || 720);
  const shapes = Array.isArray(drawingData.shapes) ? drawingData.shapes : [];
  const background = options.background || '#0f172a';

  const body = shapes.map((shape) => {
    const color = esc(shape.color || '#22d3ee');
    const size = Number(shape.size || 4);
    const points = shape.points || [];
    const common = `stroke="${color}" stroke-width="${size}" stroke-linecap="round" stroke-linejoin="round"`;

    if (shape.tool === 'text') {
      const point = points[0] || { x: 24, y: 32 };
      return `<text x="${Number(point.x || 0).toFixed(1)}" y="${Number(point.y || 0).toFixed(1)}" fill="${color}" font-size="${Math.max(18, size * 5)}" font-family="Arial, sans-serif" font-weight="700">${esc(shape.text || 'Coach note')}</text>`;
    }

    if (shape.tool === 'ellipse' || shape.tool === 'circle') {
      const start = points[0] || { x: 0, y: 0 };
      const end = points[1] || start;
      const cx = (start.x + end.x) / 2;
      const cy = (start.y + end.y) / 2;
      const rx = Math.abs(end.x - start.x) / 2;
      const ry = Math.abs(end.y - start.y) / 2;
      return `<ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" fill="none" ${common} />`;
    }

    if (shape.tool === 'angle') {
      return `<path d="${pointsPath(points.slice(0, 3))}" fill="none" ${common} />`;
    }

    if (shape.tool === 'body_line') {
      return `<path d="${pointsPath(points)}" fill="none" stroke="${color}" stroke-width="${Math.max(size, 6)}" stroke-dasharray="16 10" stroke-linecap="round" />`;
    }

    const path = `<path d="${pointsPath(points)}" fill="none" ${common} />`;
    return shape.tool === 'arrow' ? `${path}${arrowHead(shape)}` : path;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Coach-created annotation">
    <rect width="${width}" height="${height}" fill="${background}" opacity="0.92" />
    <g>${body}</g>
  </svg>`;
}
