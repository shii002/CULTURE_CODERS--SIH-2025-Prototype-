// script.js - Frontend logic: upload preview, send to Flask, display processed result
const uploadBtn = document.getElementById("uploadBtn");
const imageInput = document.getElementById("imageInput");
const previewBox = document.getElementById("previewBox");
const detectBtn = document.getElementById("detectBtn");
const resultBox = document.getElementById("resultBox");
const downloadBtn = document.getElementById("downloadBtn");

let lastProcessedDataUrl = null;

uploadBtn.addEventListener("click", () => imageInput.click());

// Show preview when file selected
imageInput.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    previewBox.innerHTML = `<img src="${reader.result}" alt="preview">`;
    // clear previous result
    resultBox.innerHTML = "Result will appear here";
    downloadBtn.disabled = true;
    lastProcessedDataUrl = null;
  };
  reader.readAsDataURL(file);
});

// Detect button: send to backend
detectBtn.addEventListener("click", () => {
  const file = imageInput.files[0];
  if (!file) {
    alert("Please upload an image first!");
    return;
  }

  detectBtn.disabled = true;
  detectBtn.textContent = "Processing...";

  const formData = new FormData();
  formData.append("image", file);

  fetch("http://127.0.0.1:5000/detect", {
    method: "POST",
    body: formData
  })
    .then(async res => {
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Server error: ${txt}`);
      }
      return res.json();
    })
    .then(data => {
      if (!data.processed_image) throw new Error("No processed_image in response");
      // data.processed_image is base64 PNG (no header)
      const dataUrl = `data:image/png;base64,${data.processed_image}`;
      resultBox.innerHTML = `<img src="${dataUrl}" alt="processed">`;
      lastProcessedDataUrl = dataUrl;
      downloadBtn.disabled = false;
    })
    .catch(err => {
      console.error(err);
      alert("Processing failed. Check backend console.");
    })
    .finally(() => {
      detectBtn.disabled = false;
      detectBtn.textContent = "🔍 Detect Kolam";
    });
});

// Download processed PNG
downloadBtn.addEventListener("click", () => {
  if (!lastProcessedDataUrl) return;
  const a = document.createElement("a");
  a.href = lastProcessedDataUrl;
  a.download = "kolam_processed.png";
  a.click();
});
