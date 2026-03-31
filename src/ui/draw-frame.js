// src/ui/draw-frame.js

export function drawFrame(frame) {
  const canvas = document.getElementById('main');
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!frame || !frame.region) return;

  const { region, pivot, transform } = frame;

  // Draw region box
  ctx.strokeStyle = '#00e0ff';
  ctx.lineWidth = 2;
  ctx.strokeRect(region.x, region.y, region.width, region.height);

  // Draw pivot
  if (pivot) {
    ctx.fillStyle = '#ff0066';
    ctx.beginPath();
    ctx.arc(pivot.x, pivot.y, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw transform handles (MVP)
  if (pivot && transform) {
    const handleLength = 40;

    // Rotation handle
    const rotX = pivot.x + Math.cos(transform.rotation) * handleLength;
    const rotY = pivot.y + Math.sin(transform.rotation) * handleLength;

    ctx.strokeStyle = '#ffcc00';
    ctx.beginPath();
    ctx.moveTo(pivot.x, pivot.y);
    ctx.lineTo(rotX, rotY);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(rotX, rotY, 6, 0, Math.PI * 2);
    ctx.stroke();

    // Scale handle (simple MVP: scale affects radius)
    const scaleRadius = 10 * transform.scale;
    ctx.strokeStyle = '#00ff88';
    ctx.beginPath();
    ctx.arc(pivot.x, pivot.y, scaleRadius, 0, Math.PI * 2);
    ctx.stroke();
  }
}