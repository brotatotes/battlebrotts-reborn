export function slideIndex(value, count) {
  const parsed = Number.parseInt(String(value).replace(/^#slide-/, ''), 10);
  return Math.max(0, Math.min(count - 1, Number.isFinite(parsed) ? parsed - 1 : 0));
}
export function keySlide(key, current, count) {
  if (key === 'Home') return 0;
  if (key === 'End') return count - 1;
  if (key === 'ArrowRight') return Math.min(count - 1, current + 1);
  if (key === 'ArrowLeft') return Math.max(0, current - 1);
  return current;
}
