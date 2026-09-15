import test from 'node:test';
import assert from 'node:assert/strict';
import {slideIndex, keySlide} from '../src/slide-state.js';
test('presentation navigation and direct links never leave the five-slide bounds', () => {
  assert.equal(slideIndex('#slide-3', 5), 2);
  for (const bad of ['', '#no', '#slide--3', '#slide-0']) assert.equal(slideIndex(bad, 5), 0);
  assert.equal(slideIndex('#slide-99', 5), 4);
  assert.equal(keySlide('Home', 3, 5), 0);
  assert.equal(keySlide('End', 1, 5), 4);
  assert.equal(keySlide('ArrowRight', 4, 5), 4);
  assert.equal(keySlide('ArrowLeft', 0, 5), 0);
  assert.equal(keySlide('ArrowRight', 0, 5), 1);
  assert.equal(keySlide('Tab', 2, 5), 2);
});
