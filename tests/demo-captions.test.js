import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseCaptions,captionAt} from '../src/demo-captions.js';

test('readable demo captions follow all six real edit boundaries',()=>{
  const cues=parseCaptions(readFileSync(new URL('../media/battlebrotts-demo.vtt',import.meta.url),'utf8'));
  assert.equal(cues.length,6);
  assert.match(captionAt(cues,0),/CLASSIC/);
  assert.match(captionAt(cues,10),/Choose Close Coil/);
  assert.match(captionAt(cues,16),/One target click/);
  assert.match(captionAt(cues,29),/Circular impact pulses/);
  assert.match(captionAt(cues,45),/Separate Long Barrel run/);
  assert.match(captionAt(cues,63.95),/real win/);
  assert.equal(captionAt(cues,64),'');
  assert.equal(captionAt(cues,-1),'');
  assert.deepEqual(parseCaptions('WEBVTT'),[]);
});
