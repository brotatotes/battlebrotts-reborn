import {WIDTH, HEIGHT} from './sim.js';

// Portrait rotates the same whole arena, never crops enemies or changes physics.
// Rendering and pointer input share these exact inverse transforms.
export function viewportSize(portrait) {
  return portrait ? {width: HEIGHT, height: WIDTH} : {width: WIDTH, height: HEIGHT};
}
export function worldToView(point, portrait) {
  return portrait ? {x: HEIGHT - point.y, y: point.x} : {x: point.x, y: point.y};
}
export function viewToWorld(point, portrait) {
  return portrait ? {x: point.y, y: HEIGHT - point.x} : {x: point.x, y: point.y};
}
export function pointerToWorld(client, rect, portrait) {
  const size = viewportSize(portrait);
  return viewToWorld({x: (client.x - rect.left) * size.width / rect.width, y: (client.y - rect.top) * size.height / rect.height}, portrait);
}
export function setWorldTransform(ctx, pixelWidth, portrait) {
  const scale = pixelWidth / viewportSize(portrait).width;
  if (portrait) ctx.setTransform(0, scale, -scale, 0, HEIGHT * scale, 0);
  else ctx.setTransform(scale, 0, 0, scale, 0, 0);
}
