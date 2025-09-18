# backend/app.py
# Simple Flask backend that accepts an uploaded image, runs a basic OpenCV pipeline (grayscale + Canny),
# and returns the processed image as base64 PNG.

from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import cv2
import base64
import io

app = Flask(__name__)
CORS(app)  # allow requests from frontend (local)

@app.route("/detect", methods=["POST"])
def detect():
    if "image" not in request.files:
        return jsonify({"error": "No image part in the request"}), 400

    file = request.files["image"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400

    # Read file to numpy array
    file_bytes = file.read()
    np_img = np.frombuffer(file_bytes, np.uint8)
    img = cv2.imdecode(np_img, cv2.IMREAD_COLOR)
    if img is None:
        return jsonify({"error": "Cannot decode image"}), 400

    try:
        # Resize to reasonable size for faster processing if too large
        max_dim = 1024
        h, w = img.shape[:2]
        if max(h, w) > max_dim:
            scale = max_dim / float(max(h, w))
            img = cv2.resize(img, (int(w*scale), int(h*scale)), interpolation=cv2.INTER_AREA)

        # Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # Optional: adaptive thresholding could be better for varied lighting,
        # but for prototype we'll use Canny edges
        blurred = cv2.GaussianBlur(gray, (5,5), 0)
        edges = cv2.Canny(blurred, 80, 160)

        # Optionally invert for white background with black lines -> make lines black on white
        # edges_inv = cv2.bitwise_not(edges)

        # Convert edges to 3-channel PNG for browser display (so it looks like image)
        edges_color = cv2.cvtColor(edges, cv2.COLOR_GRAY2BGR)

        # Encode image as PNG in memory
        success, buffer = cv2.imencode(".png", edges_color)
        if not success:
            return jsonify({"error": "Failed to encode image"}), 500

        img_b64 = base64.b64encode(buffer).decode("utf-8")
        return jsonify({"processed_image": img_b64})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
