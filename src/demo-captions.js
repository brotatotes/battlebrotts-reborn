export function parseCaptions(text) {
  const seconds = stamp => stamp.split(':').reduce((total, part) => total * 60 + Number(part), 0);
  return text.replaceAll('\r', '').split('\n\n').flatMap(block => {
    const lines = block.trim().split('\n');
    const index = lines.findIndex(line => line.includes(' --> '));
    if (index < 0) return [];
    const [start, end] = lines[index].split(' --> ').map(seconds);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return [];
    return [{start, end, text: lines.slice(index + 1).join(' ')}];
  });
}
export function captionAt(cues, time) {
  return cues.find(cue => time >= cue.start && time < cue.end)?.text ?? '';
}
if (typeof document !== 'undefined') {
  const video = document.querySelector('video');
  const output = document.querySelector('#readable-caption');
  if (video && output) {
    fetch('media/battlebrotts-demo.vtt').then(response => {
      if (!response.ok) throw Error('Caption download failed');
      return response.text();
    }).then(text => {
      const cues = parseCaptions(text);
      const update = () => { output.textContent = captionAt(cues, video.currentTime); };
      video.addEventListener('timeupdate', update);
      video.addEventListener('seeked', update);
      update();
    }).catch(() => { output.textContent = 'Captions are also in the video and transcript below.'; });
  }
}
