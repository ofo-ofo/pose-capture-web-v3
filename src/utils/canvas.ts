/**
 * Draw a simple rectangular overlay with a centre vertical line.
 * Colour can be set based on evaluation level (green, amber, red).
 */
export function drawOverlay(
  ctx: CanvasRenderingContext2D,
  colour: string,
  width: number,
  height: number
): void {
  ctx.clearRect(0, 0, width, height);
  ctx.strokeStyle = colour;
  ctx.lineWidth = 4;
  // Draw outer rectangle
  ctx.strokeRect(2, 2, width - 4, height - 4);
  // Draw vertical centre line
  ctx.beginPath();
  ctx.moveTo(width / 2, 0);
  ctx.lineTo(width / 2, height);
  ctx.stroke();
}