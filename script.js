const imageInput = document.getElementById('imageInput');
const dropZone = document.getElementById('dropZone');
const previewBox = document.getElementById('previewBox');
const resultBox = document.getElementById('resultBox');
const detectBtn = document.getElementById('detectBtn');
const downloadBtn = document.getElementById('downloadBtn');
const spinnerTpl = document.getElementById('spinnerTpl');

let lastProcessedDataUrl = null;
let currentFile = null;

// Drag & Drop UX
;['dragenter','dragover'].forEach(evt =>
  dropZone.addEventListener(evt, e => {
    e.preventDefault(); e.stopPropagation();
    dropZone.classList.add('dragover');
  })
);
;['dragleave','drop'].forEach(evt =>
  dropZone.addEventListener(evt, e => {
    e.preventDefault(); e.stopPropagation();
    dropZone.classList.remove('dragover');
  })
);

dropZone.addEventListener('drop', e => {
  const dt = e.dataTransfer;
  if (dt && dt.files && dt.files.length) {
    imageInput.files = dt.files;
    handleFile(dt.files[0]);
  }
});

// Click to open file selector
dropZone.addEventListener('click', () => imageInput.click());
imageInput.addEventListener('change', e => {
  if (e.target.files && e.target.files[0]) handleFile(e.target.files[0]);
});

function handleFile(file){
  currentFile = file;
  lastProcessedDataUrl = null;
  downloadBtn.disabled = true;
  resultBox.innerHTML = 'Result will appear here';
  const reader = new FileReader();
  reader.onload = (ev) => {
    previewBox.innerHTML = `<img src="${ev.target.result}" alt="preview">`;
  };
  reader.readAsDataURL(file);
}

// Show spinner
function showProcessing(){
  resultBox.innerHTML = '';
  const tpl = spinnerTpl.content.cloneNode(true);
  resultBox.appendChild(tpl);
  detectBtn.disabled = true;
  detectBtn.textContent = 'Processing...';
}

// Hide spinner
function hideProcessing(){
  detectBtn.disabled = false;
  detectBtn.textContent = '🔍 Detect & Recreate';
}

// Send image to backend
detectBtn.addEventListener('click', async () => {
  if (!currentFile) { alert('Please upload a Kolam image first'); return; }
  showProcessing();

  const form = new FormData();
  form.append('image', currentFile);

  try {
    const res = await fetch('http://127.0.0.1:5000/detect', {
      method: 'POST',
      body: form
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || 'Server error');
    }
    const data = await res.json();
    if (!data.processed_image) throw new Error('No processed image returned');
    const dataUrl = `data:image/png;base64,${data.processed_image}`;
    lastProcessedDataUrl = dataUrl;
    resultBox.innerHTML = `<img src="${dataUrl}" alt="processed">`;
    downloadBtn.disabled = false;
    hideProcessing();
  } catch (err) {
    console.error(err);
    hideProcessing();
    resultBox.innerHTML = `<div style="color:#b00020;padding:12px">Processing failed: ${err.message}</div>`;
  }
});

// Download handler
downloadBtn.addEventListener('click', () => {
  if (!lastProcessedDataUrl) return;
  const a = document.createElement('a');
  a.href = lastProcessedDataUrl;
  a.download = 'kolam_processed.png';
  a.click();
});
