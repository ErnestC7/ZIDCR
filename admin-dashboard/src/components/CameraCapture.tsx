import { useRef, useState, useCallback, useEffect } from 'react';
import { Camera, RefreshCw, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import * as faceapi from 'face-api.js';

interface Props {
  onCapture: (base64Image: string) => void;
}

// Face detection model weights — loaded from CDN (no local files needed)
const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.13/model';

export default function CameraCapture({ onCapture }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectionLoopRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImg, setCapturedImg] = useState<string | null>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [modelError, setModelError] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [faceBox, setFaceBox] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const [confidence, setConfidence] = useState<number>(0);

  // ─── Load face detection model on component mount ───────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        setModelsLoaded(true);
      } catch (err) {
        console.warn('Face detection model failed to load from CDN:', err);
        setModelError(true);
      }
    };
    load();
  }, []);

  // ─── Attach stream to video element after render ─────────────────────────
  useEffect(() => {
    if (stream && videoRef.current && !videoRef.current.srcObject) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // ─── Run face detection loop when stream is active ───────────────────────
  useEffect(() => {
    if (!stream || !modelsLoaded) return;

    detectionLoopRef.current = setInterval(async () => {
      if (!videoRef.current || videoRef.current.readyState < 2) return;

      try {
        const detections = await faceapi.detectAllFaces(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 })
        );

        if (detections.length === 1) {
          // Exactly one face — ideal
          const det = detections[0];
          const videoEl = videoRef.current!;
          const scaleX = videoEl.clientWidth / videoEl.videoWidth;
          const scaleY = videoEl.clientHeight / videoEl.videoHeight;

          setFaceDetected(true);
          setConfidence(Math.round(det.score * 100));
          setFaceBox({
            left:   det.box.x      * scaleX,
            top:    det.box.y      * scaleY,
            width:  det.box.width  * scaleX,
            height: det.box.height * scaleY,
          });
        } else {
          setFaceDetected(false);
          setFaceBox(null);
          setConfidence(0);
        }
      } catch {
        // Silently skip on frame errors
      }
    }, 250); // Run 4x per second

    return () => {
      if (detectionLoopRef.current) clearInterval(detectionLoopRef.current);
    };
  }, [stream, modelsLoaded]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      setStream(mediaStream);
    } catch {
      alert('Could not access camera. Please grant camera permissions in your browser.');
    }
  };

  const stopCamera = useCallback(() => {
    if (detectionLoopRef.current) clearInterval(detectionLoopRef.current);
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      setStream(null);
    }
    setFaceDetected(false);
    setFaceBox(null);
  }, [stream]);

  const capturePhoto = () => {
    // Block capture if face detection is active but no face is found
    if (modelsLoaded && !modelError && !faceDetected) return;

    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width  = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const base64 = canvas.toDataURL('image/jpeg').split(',')[1];
        setCapturedImg(`data:image/jpeg;base64,${base64}`);
        stopCamera();
        onCapture(base64);
      }
    }
  };

  const retake = () => {
    setCapturedImg(null);
    setFaceDetected(false);
    setFaceBox(null);
    startCamera();
  };

  // ─── Status helpers ───────────────────────────────────────────────────────
  const statusLabel = () => {
    if (!modelsLoaded && !modelError) return { text: 'Loading AI Model...', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' };
    if (modelError)                   return { text: 'AI Model Offline — Manual Capture', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' };
    if (faceDetected)                 return { text: `FACE DETECTED  ${confidence}%`, color: 'bg-green-500/20 text-green-400 border-green-500/30' };
    return { text: 'NO FACE DETECTED — Align your face', color: 'bg-red-500/20 text-red-400 border-red-500/30' };
  };

  const canCapture = modelError || (modelsLoaded && faceDetected);

  return (
    <div className="w-full flex flex-col items-center gap-4">

      {/* ── Idle state: Show activate button ── */}
      {!stream && !capturedImg && (
        <div className="flex flex-col items-center gap-3">
          {!modelsLoaded && !modelError && (
            <div className="flex items-center gap-2 text-slate-500 text-sm mb-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading face detection AI model...
            </div>
          )}
          <button
            onClick={startCamera}
            className="flex items-center gap-2 bg-blue-900 text-white px-8 py-3 rounded-lg hover:bg-blue-800 transition-colors shadow-lg font-bold"
          >
            <Camera className="w-5 h-5" />
            Activate Camera
          </button>
        </div>
      )}

      {/* ── Live camera feed with face detection overlay ── */}
      {stream && !capturedImg && (
        <div className="flex flex-col items-center gap-4 w-full max-w-md">
          <div className="relative rounded-2xl overflow-hidden shadow-xl border-4 border-blue-900 w-full bg-black aspect-video">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />

            {/* Dynamic face tracking bounding box */}
            {faceBox && (
              <div
                className="absolute border-2 border-green-400 transition-all duration-100 pointer-events-none"
                style={{
                  left:   faceBox.left,
                  top:    faceBox.top,
                  width:  faceBox.width,
                  height: faceBox.height,
                  boxShadow: '0 0 12px 2px rgba(34, 197, 94, 0.4)',
                }}
              >
                {/* Corner accents */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-green-400" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-green-400" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-green-400" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-green-400" />
              </div>
            )}

            {/* No-face warning overlay */}
            {modelsLoaded && !modelError && !faceDetected && (
              <div className="absolute inset-0 border-4 border-red-500/60 rounded-xl pointer-events-none animate-pulse" />
            )}

            {/* Capture button */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center">
              <button
                onClick={capturePhoto}
                disabled={!canCapture}
                title={!canCapture ? 'A face must be detected before capturing' : 'Capture photo'}
                className="bg-white text-gray-900 rounded-full p-4 shadow-xl hover:scale-105 transition-transform disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
              >
                <Camera className="w-8 h-8" />
              </button>
            </div>
          </div>

          {/* Status HUD */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-mono font-bold transition-all ${statusLabel().color}`}>
            {!modelsLoaded && !modelError && <Loader2 className="w-3 h-3 animate-spin" />}
            {modelsLoaded && faceDetected && <CheckCircle2 className="w-3 h-3" />}
            {modelsLoaded && !faceDetected && !modelError && <AlertTriangle className="w-3 h-3" />}
            {statusLabel().text}
          </div>

          {/* Instructions */}
          {modelsLoaded && !faceDetected && !modelError && (
            <p className="text-sm text-red-600 font-semibold text-center">
              Only a clear, front-facing human face can be captured. Ensure good lighting and face the camera directly.
            </p>
          )}
        </div>
      )}

      {/* ── Captured image preview ── */}
      {capturedImg && (
        <div className="flex flex-col items-center gap-4 w-full max-w-md">
          <div className="relative rounded-2xl overflow-hidden shadow-lg border-4 border-blue-900 w-full">
            <img src={capturedImg} alt="Captured biometric" className="w-full" />
            <div className="absolute top-3 right-3 bg-white rounded-full p-1 shadow">
              <CheckCircle2 className="w-8 h-8 text-blue-900" />
            </div>
            <div className="absolute bottom-3 left-3 bg-green-900/80 text-green-300 text-xs font-mono font-bold px-3 py-1 rounded-full">
              BIOMETRIC CAPTURED
            </div>
          </div>
          <button
            onClick={retake}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors font-semibold"
          >
            <RefreshCw className="w-4 h-4" />
            Retake Photo
          </button>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
