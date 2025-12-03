import React, { useState, useRef } from "react";
import { useDarkMode } from "../../DarkModeContext";
import { Link } from "react-router-dom";
import "./Diagnosis.css";

const Diagnosis = () => {
  const { isDarkMode } = useDarkMode();
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // --- Choose File ---
  const handleFileChoose = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  // --- Mobile Camera ---
  const handleMobileCamera = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  // --- Desktop Webcam ---
  const openDesktopCamera = async () => {
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      console.error("Webcam error:", err);
      alert("Webcam not accessible.");
      setShowCamera(false);
    }
  };

  const captureDesktopPhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      const file = new File([blob], "photo.jpg", { type: "image/jpeg" });
      setImage(file);
      setPreview(URL.createObjectURL(file));
      setShowCamera(false);

      // Stop webcam stream
      const stream = video.srcObject;
      if (stream) stream.getTracks().forEach((track) => track.stop());
    }, "image/jpeg");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image) return alert("Please select or take a photo.");
    setLoading(true);

    const formData = new FormData();
    formData.append("file", image);

    try {
      const response = await fetch("http://10.145.168.93:8000/predict", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      const value = data.predicted_disease.replaceAll("_", " ").replaceAll("  ", " ");
      setResult(value);
    } catch (err) {
      console.error("Error:", err);
      alert("Error uploading image.");
    } finally {
      setLoading(false);
    }
  };

  // Detect if device is mobile
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  return (
    <div
      className="diagnosisContainer"
      style={isDarkMode ? { color: "white", backgroundColor: "#2e302f" } : { color: "black" }}
    >
      <h3>Diagnose Your Plant</h3>

      <div className="uploadOptions">
        {/* Take Photo Button */}
        {isMobile ? (
          <input
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: "none" }}
            id="mobileCamera"
            onChange={handleMobileCamera}
          />
        ) : null}
        <button
          className="button"
          onClick={() => {
            if (isMobile) {
              document.getElementById("mobileCamera").click();
            } else {
              openDesktopCamera();
            }
          }}
        >
          Take Photo
        </button>

        {/* Choose File Button */}
        <input
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          id="fileInput"
          onChange={handleFileChoose}
        />
        <button className="button" onClick={() => document.getElementById("fileInput").click()}>
          Choose File
        </button>
      </div>

      {/* Desktop Webcam Modal */}
      {showCamera && (
        <div className="cameraModal">
          <video ref={videoRef} autoPlay style={{ width: "100%" }} />
          <button className="button" onClick={captureDesktopPhoto}>
            Capture Photo
          </button>
          <button
            className="button"
            onClick={() => {
              setShowCamera(false);
              const stream = videoRef.current.srcObject;
              if (stream) stream.getTracks().forEach((track) => track.stop());
            }}
          >
            Cancel
          </button>
          <canvas ref={canvasRef} style={{ display: "none" }} />
        </div>
      )}

      {/* Preview & Submit */}
      {preview && (
        <div className="finalUpload">
          <img src={preview} alt="Preview" />
          <button className="button" onClick={handleSubmit} disabled={loading}>
            {loading ? "Detecting..." : "Detect Disease"}
          </button>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="PlateContainer">
          <p className="diseaseDetectedPlate">Detected Disease: {result}</p>
          <Link to={`/treatment?disease=${encodeURIComponent(result)}`} className="treatmentBtn">
            See Treatments
          </Link>
        </div>
      )}
    </div>
  );
};

export default Diagnosis;
