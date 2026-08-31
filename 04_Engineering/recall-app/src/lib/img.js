// Photo compression: keep Firestore docs well under the 1MB limit.
function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = reject;
    img.src = url;
  });
}

function scaleToJpeg(img, maxDim, quality) {
  const ratio = Math.min(1, maxDim / Math.max(img.width, img.height));
  const w = Math.round(img.width * ratio);
  const h = Math.round(img.height * ratio);
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  canvas.getContext('2d').drawImage(img, 0, 0, w, h);
  return canvas.toDataURL('image/jpeg', quality);
}

export async function compressPhoto(file) {
  const img = await loadImage(file);
  return {
    photo: scaleToJpeg(img, 900, 0.72),   // ~80–180 KB
    thumb: scaleToJpeg(img, 220, 0.6),    // ~8–15 KB
  };
}
