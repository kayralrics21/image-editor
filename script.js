const SUPPORTED_IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/gif',
  'image/bmp',
  'image/tiff',
  'image/tif',
  'image/avif'
];

const COMMON_IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'tif', 'tiff', 'avif'];

function normalizeMimeType(type) {
  if (!type) return 'image/png';
  const cleaned = type.toLowerCase();
  if (cleaned === 'image/jpg') return 'image/jpeg';
  if (cleaned === 'image/tif') return 'image/tiff';
  return SUPPORTED_IMAGE_TYPES.includes(cleaned) ? cleaned : 'image/png';
}

function isSupportedImage(file) {
  if (!file) return false;
  const mime = normalizeMimeType(file.type);
  const ext = (file.name || '').split('.').pop()?.toLowerCase();
  return mime.startsWith('image/') || COMMON_IMAGE_EXTENSIONS.includes(ext);
}

function getExtensionFromMime(mimeType) {
  switch (normalizeMimeType(mimeType)) {
    case 'image/jpeg': return 'jpg';
    case 'image/webp': return 'webp';
    case 'image/gif': return 'gif';
    case 'image/bmp': return 'bmp';
    case 'image/tiff': return 'tiff';
    case 'image/avif': return 'avif';
    default: return 'png';
  }
}

const navButtons = document.querySelectorAll('.nav-item');
const panels = document.querySelectorAll('.panel');

navButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const target = button.dataset.target;
    navButtons.forEach((item) => item.classList.toggle('active', item === button));
    panels.forEach((panel) => {
      panel.classList.toggle('active', panel.id === target);
    });
  });
});

const sizePresets = document.querySelectorAll('.size-preset');
sizePresets.forEach((preset) => {
  preset.addEventListener('click', () => {
    sizePresets.forEach((item) => item.classList.toggle('active', item === preset));
    document.getElementById('resize-width').value = preset.dataset.width;
    document.getElementById('resize-height').value = preset.dataset.height;
    renderResizedCanvas();
  });
});

function setDropzone(fileInput, dropzone, callback) {
  dropzone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (event) => {
    const [file] = event.target.files;
    if (!file) return;
    if (!isSupportedImage(file)) {
      alert('Unsupported image format. Please use PNG, JPG, WEBP, BMP, GIF, TIFF, or AVIF.');
      fileInput.value = '';
      return;
    }
    callback(file);
  });

  ['dragenter', 'dragover'].forEach((eventName) => {
    dropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropzone.style.borderColor = 'rgba(255, 90, 90, 0.8)';
      dropzone.style.background = 'rgba(255, 40, 40, 0.06)';
    });
  });

  ['dragleave', 'drop'].forEach((eventName) => {
    dropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropzone.style.borderColor = 'rgba(255, 80, 80, 0.35)';
      dropzone.style.background = 'linear-gradient(135deg, rgba(255, 55, 55, 0.04), rgba(255, 255, 255, 0.02))';
    });
  });

  dropzone.addEventListener('drop', (event) => {
    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    if (!isSupportedImage(file)) {
      alert('Unsupported image format. Please use PNG, JPG, WEBP, BMP, GIF, TIFF, or AVIF.');
      return;
    }
    callback(file);
  });
}

function fileToImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function downloadCanvas(canvas, filename, mimeType = 'image/png', quality = 1) {
  const safeMime = normalizeMimeType(mimeType);
  const link = document.createElement('a');
  link.download = filename;
  const dataUrl = safeMime === 'image/png' ? canvas.toDataURL(safeMime) : canvas.toDataURL(safeMime, quality);
  link.href = dataUrl;
  link.click();
}

const resizerCanvas = document.getElementById('resizer-canvas');
const resizerCtx = resizerCanvas.getContext('2d');
let resizerImage = null;

function renderResizedCanvas() {
  if (!resizerImage) return;

  const widthInput = document.getElementById('resize-width');
  const heightInput = document.getElementById('resize-height');
  const targetWidth = Math.max(1, Number(widthInput.value) || resizerImage.width);
  const targetHeight = Math.max(1, Number(heightInput.value) || resizerImage.height);

  resizerCanvas.width = targetWidth;
  resizerCanvas.height = targetHeight;
  resizerCtx.clearRect(0, 0, targetWidth, targetHeight);
  resizerCtx.fillStyle = '#111111';
  resizerCtx.fillRect(0, 0, targetWidth, targetHeight);
  resizerCtx.drawImage(resizerImage, 0, 0, targetWidth, targetHeight);
}

setDropzone(document.getElementById('resizer-file'), document.getElementById('resizer-dropzone'), async (file) => {
  resizerImage = await fileToImage(file);
  renderResizedCanvas();
});

document.getElementById('resize-width').addEventListener('input', renderResizedCanvas);
document.getElementById('resize-height').addEventListener('input', renderResizedCanvas);

document.getElementById('resize-apply').addEventListener('click', () => {
  if (!resizerImage) return;
  renderResizedCanvas();
});

document.getElementById('resize-download').addEventListener('click', () => {
  if (!resizerImage) return;

  const quality = Number(document.getElementById('resize-quality').value);
  const format = document.getElementById('resizer-format').value;
  const removeMetadata = document.getElementById('remove-metadata').checked;
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = resizerCanvas.width;
  exportCanvas.height = resizerCanvas.height;

  const exportCtx = exportCanvas.getContext('2d');
  exportCtx.fillStyle = '#111111';
  exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
  exportCtx.drawImage(resizerCanvas, 0, 0);

  const mimeType = normalizeMimeType(format || (removeMetadata ? 'image/jpeg' : 'image/png'));
  const ext = getExtensionFromMime(mimeType);
  downloadCanvas(exportCanvas, `kayralrics-image-resized.${ext}`, mimeType, quality);
});

const filterCanvas = document.getElementById('filter-canvas');
const filterCtx = filterCanvas.getContext('2d');
let filterImage = null;
let currentPreset = 'noir';

const filterConfig = {
  noir: { brightness: 90, contrast: 125, saturate: 60, sepia: 35, blur: 0 },
  ember: { brightness: 110, contrast: 155, saturate: 180, sepia: 40, blur: 0.5 },
  crimson: { brightness: 100, contrast: 140, saturate: 160, sepia: 55, blur: 0 },
  vivid: { brightness: 105, contrast: 120, saturate: 190, sepia: 10, blur: 0 },
  silver: { brightness: 95, contrast: 130, saturate: 70, sepia: 10, blur: 1 }
};

const sliderIds = ['brightness', 'contrast', 'saturate', 'sepia', 'blur'];

function updateFilterControls(presetName) {
  const preset = filterConfig[presetName] || filterConfig.noir;
  sliderIds.forEach((id) => {
    const input = document.getElementById(id);
    input.value = preset[id] ?? Number(input.value);
  });
}

function buildFilterString() {
  const brightness = document.getElementById('brightness').value;
  const contrast = document.getElementById('contrast').value;
  const saturate = document.getElementById('saturate').value;
  const sepia = document.getElementById('sepia').value;
  const blur = document.getElementById('blur').value;

  return `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturate}%) sepia(${sepia}%) blur(${blur}px)`;
}

function renderFilteredImage() {
  if (!filterImage) return;
  filterCanvas.width = filterImage.width;
  filterCanvas.height = filterImage.height;
  filterCtx.clearRect(0, 0, filterCanvas.width, filterCanvas.height);
  filterCtx.filter = buildFilterString();
  filterCtx.drawImage(filterImage, 0, 0, filterCanvas.width, filterCanvas.height);
  filterCtx.filter = 'none';
}

sliderIds.forEach((id) => {
  document.getElementById(id).addEventListener('input', renderFilteredImage);
});

document.querySelectorAll('.preset').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.preset').forEach((item) => item.classList.toggle('active', item === button));
    currentPreset = button.dataset.preset;
    updateFilterControls(currentPreset);
    renderFilteredImage();
  });
});

setDropzone(document.getElementById('filter-file'), document.getElementById('filter-dropzone'), async (file) => {
  filterImage = await fileToImage(file);
  renderFilteredImage();
});

document.getElementById('filter-reset').addEventListener('click', () => {
  updateFilterControls(currentPreset);
  renderFilteredImage();
});

document.getElementById('filter-download').addEventListener('click', () => {
  if (!filterImage) return;
  const format = document.getElementById('filter-format').value;
  const mimeType = normalizeMimeType(format);
  const ext = getExtensionFromMime(mimeType);
  downloadCanvas(filterCanvas, `kayralrics-filtered-image.${ext}`, mimeType, Number(document.getElementById('saturate').value) / 200);
});

const editCanvas = document.getElementById('edit-canvas');
const editCtx = editCanvas.getContext('2d');
let editImage = null;
let editRotation = 0;
let flipX = false;
let flipY = false;

function renderEditCanvas() {
  if (!editImage) return;

  const brightness = Number(document.getElementById('exposure').value);
  const warmth = Number(document.getElementById('warmth').value);

  editCanvas.width = editImage.width;
  editCanvas.height = editImage.height;
  editCtx.clearRect(0, 0, editCanvas.width, editCanvas.height);
  editCtx.save();
  const cx = editCanvas.width / 2;
  const cy = editCanvas.height / 2;
  editCtx.translate(cx, cy);
  editCtx.rotate((editRotation * Math.PI) / 180);
  if (flipX) editCtx.scale(-1, 1);
  if (flipY) editCtx.scale(1, -1);
  editCtx.translate(-cx, -cy);
  editCtx.filter = `brightness(${brightness}%) contrast(110%) saturate(${warmth}%) sepia(8%)`;
  editCtx.drawImage(editImage, 0, 0, editCanvas.width, editCanvas.height);
  editCtx.restore();
}

setDropzone(document.getElementById('edit-file'), document.getElementById('edit-dropzone'), async (file) => {
  editImage = await fileToImage(file);
  editRotation = 0;
  flipX = false;
  flipY = false;
  renderEditCanvas();
});

document.querySelectorAll('.edit-button').forEach((button) => {
  button.addEventListener('click', () => {
    const rotate = button.dataset.rotate;
    const flip = button.dataset.flip;

    if (rotate) editRotation += Number(rotate);
    if (flip === 'x') flipX = !flipX;
    if (flip === 'y') flipY = !flipY;

    renderEditCanvas();
  });
});

document.getElementById('exposure').addEventListener('input', renderEditCanvas);
document.getElementById('warmth').addEventListener('input', renderEditCanvas);

document.getElementById('edit-reset').addEventListener('click', () => {
  editRotation = 0;
  flipX = false;
  flipY = false;
  document.getElementById('exposure').value = 100;
  document.getElementById('warmth').value = 100;
  renderEditCanvas();
});

document.getElementById('edit-download').addEventListener('click', () => {
  if (!editImage) return;
  const format = document.getElementById('edit-format').value;
  const mimeType = normalizeMimeType(format);
  const ext = getExtensionFromMime(mimeType);
  downloadCanvas(editCanvas, `kayralrics-edited-image.${ext}`, mimeType, Number(document.getElementById('warmth').value) / 200);
});

updateFilterControls(currentPreset);
renderResizedCanvas();
renderFilteredImage();
renderEditCanvas();
