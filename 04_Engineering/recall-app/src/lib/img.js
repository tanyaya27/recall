// Photo compression: keep Firestore docs well under the 1MB limit.
//
// Two renditions per photo:
//   photo — the whole picture, longest side 900 px. Shown on the thing card.
//   thumb — a centre square, THUMB_PX on a side, for the board tiles (which are square,
//           object-fit: cover). Until 2026-09-14 this was 220 px on the longest side, so a
//           portrait photo's short side was ~165 px, stretched over a ~170-CSS-px tile at 3×
//           device pixels — three times upscaled, and Ravi saw it as blur. 600 px covers a
//           tile at 3× on any phone up to ~200 CSS px wide. ~40–60 KB at quality 0.8.
//           `thumbV` on the item doc says which recipe made it; App.jsx regenerates old
//           ones from `photo` once, on load.
export const THUMB_V = 2;
const THUMB_PX = 600;

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const url = src instanceof Blob ? URL.createObjectURL(src) : src;
    const img = new Image();
    img.onload = () => { if (url !== src) URL.revokeObjectURL(url); resolve(img); };
    img.onerror = reject;
    img.src = url;
  });
}

// Draw a source rectangle into a canvas of w×h, halving in steps on the way down: one big
// drawImage from a 4000-px camera frame to 600 px samples only a few of the source pixels
// and looks aliased; stepping keeps it smooth.
function draw(img, sx, sy, sw, sh, w, h) {
  let src = img, cw = sw, ch = sh, cx = sx, cy = sy;
  while (cw / 2 > w && ch / 2 > h) {
    const c = document.createElement('canvas');
    c.width = Math.round(cw / 2); c.height = Math.round(ch / 2);
    c.getContext('2d').drawImage(src, cx, cy, cw, ch, 0, 0, c.width, c.height);
    src = c; cx = 0; cy = 0; cw = c.width; ch = c.height;
  }
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(src, cx, cy, cw, ch, 0, 0, w, h);
  return canvas;
}

function scaleToJpeg(img, maxDim, quality) {
  const ratio = Math.min(1, maxDim / Math.max(img.width, img.height));
  const w = Math.round(img.width * ratio);
  const h = Math.round(img.height * ratio);
  return draw(img, 0, 0, img.width, img.height, w, h).toDataURL('image/jpeg', quality);
}

function squareThumb(img) {
  const side = Math.min(img.width, img.height);
  const sx = Math.round((img.width - side) / 2), sy = Math.round((img.height - side) / 2);
  const out = Math.min(THUMB_PX, side);
  return draw(img, sx, sy, side, side, out, out).toDataURL('image/jpeg', 0.8);
}

export async function compressPhoto(file) {
  const img = await loadImage(file);
  return {
    photo: scaleToJpeg(img, 900, 0.72),   // ~80–180 KB
    thumb: squareThumb(img),              // ~40–60 KB
  };
}

// Rebuild a thumb from an already-stored photo (data URL). Used once per old item.
export async function thumbFromPhoto(photoDataUrl) {
  const img = await loadImage(photoDataUrl);
  return squareThumb(img);
}

// A smaller copy of a stored image for sending to the model (the same-thing check sends
// several at once). 320 px square is plenty for "is this the same object".
export async function shrink(dataUrl, px = 320) {
  const img = await loadImage(dataUrl);
  const side = Math.min(img.width, img.height);
  const out = Math.min(px, side);
  return draw(img, Math.round((img.width - side) / 2), Math.round((img.height - side) / 2), side, side, out, out).toDataURL('image/jpeg', 0.7);
}
