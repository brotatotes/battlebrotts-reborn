import {slideIndex, keySlide} from './slide-state.js';
const slides = [...document.querySelectorAll('.slide')];
const previous = document.getElementById('previous'), next = document.getElementById('next');
let current = 0;
function show(index) {
  current = Math.max(0, Math.min(slides.length - 1, index));
  slides.forEach((slide, i) => { slide.hidden = i !== current; });
  previous.disabled = current === 0;
  next.disabled = current === slides.length - 1;
  document.getElementById('slide-status').textContent = `Slide ${current + 1} of ${slides.length}`;
  history.replaceState(null, '', `#slide-${current + 1}`);
}
previous.addEventListener('click', () => show(current - 1));
next.addEventListener('click', () => show(current + 1));
window.addEventListener('hashchange', () => show(slideIndex(location.hash, slides.length)));
document.addEventListener('keydown', event => {
  if (event.altKey || event.ctrlKey || event.metaKey || event.target.matches('input,textarea,select,[contenteditable="true"]')) return;
  if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
    event.preventDefault(); show(keySlide(event.key, current, slides.length));
  }
});
show(slideIndex(location.hash, slides.length));
