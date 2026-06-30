"use client";

import { useRef, useState, useEffect, useCallback } from "react";

type ScanResult = {
  refNumber: string;
  error?: string;
  fullName?: string;
  mission?: string;
  program?: string;
  status?: string;
  alreadyScanned?: boolean;
};

type ScanMethod = "detecting" | "native" | "jsqr" | "unavailable";

export function QrScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastScannedRef = useRef<string>("");
  const cooldownRef = useRef<NodeJS.Timeout | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [manualRef, setManualRef] = useState("");
  const [scanMethod, setScanMethod] = useState<ScanMethod>("detecting");

  // Resolve which scan engine to use — BarcodeDetector if it supports qr_code, else jsQR
  useEffect(() => {
    async function detect() {
      if (typeof window === "undefined" || !("BarcodeDetector" in window)) {
        setScanMethod("jsqr");
        return;
      }
      try {
        const formats: string[] = await (window as any).BarcodeDetector.getSupportedFormats();
        setScanMethod(formats.includes("qr_code") ? "native" : "jsqr");
      } catch {
        setScanMethod("jsqr");
      }
    }
    detect();
  }, []);

  const lookupRef = useCallback(async (refNumber: string) => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/attendance/lookup?ref=${encodeURIComponent(refNumber)}`,
      );
      const data = await res.json();
      if (!res.ok) {
        setResult({ refNumber, error: data.error ?? "Not found" });
      } else {
        setResult({ refNumber, ...data });
      }
    } catch {
      setResult({ refNumber, error: "Network error" });
    } finally {
      setLoading(false);
    }
  }, [loading]);

  const onDetected = useCallback(
    (value: string) => {
      if (value === lastScannedRef.current) return;
      lastScannedRef.current = value;
      lookupRef(value);
      if (cooldownRef.current) clearTimeout(cooldownRef.current);
      cooldownRef.current = setTimeout(() => {
        lastScannedRef.current = "";
      }, 3000);
    },
    [lookupRef],
  );

  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
    } catch {
      setCameraError(
        "Camera access denied. Please allow camera access in your browser settings, or use manual entry below.",
      );
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraActive(false);
  }, []);

  // Scanning loop — starts once camera is active AND scan method is resolved
  useEffect(() => {
    if (!cameraActive || scanMethod === "detecting") return;

    let active = true;

    if (scanMethod === "native") {
      // BarcodeDetector API — hardware-accelerated on Chrome/Edge/Android
      const detector = new (window as any).BarcodeDetector({ formats: ["qr_code"] });
      const scan = async () => {
        if (!active) return;
        const video = videoRef.current;
        if (video && video.readyState >= 2) {
          try {
            const codes = await detector.detect(video);
            if (codes.length > 0) onDetected(codes[0].rawValue);
          } catch { /* ignore individual frame errors */ }
        }
        rafRef.current = requestAnimationFrame(scan);
      };
      rafRef.current = requestAnimationFrame(scan);
    } else {
      // jsQR fallback — pure-JS decoder, works in all browsers
      import("jsqr").then(({ default: jsQR }) => {
        if (!active) return;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d", { willReadFrequently: true });
        if (!canvas || !ctx) return;

        const scan = () => {
          if (!active) return;
          const video = videoRef.current;
          if (video && video.readyState >= 2 && video.videoWidth > 0) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: "dontInvert",
            });
            if (code?.data) onDetected(code.data);
          }
          rafRef.current = requestAnimationFrame(scan);
        };
        rafRef.current = requestAnimationFrame(scan);
      });
    }

    return () => {
      active = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [cameraActive, scanMethod, onDetected]);

  // Auto-start camera on mount
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
      if (cooldownRef.current) clearTimeout(cooldownRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-6">
      {/* Camera panel */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Camera Scanner</h2>
            {/* Engine badge */}
            {scanMethod === "native" && (
              <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-semibold text-teal-700">
                BarcodeDetector API
              </span>
            )}
            {scanMethod === "jsqr" && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                jsQR fallback
              </span>
            )}
          </div>
          {scanMethod === "jsqr" && (
            <p className="mt-1 text-xs text-amber-600">
              BarcodeDetector API not available or does not support QR codes on this browser/platform — using jsQR instead.
            </p>
          )}
        </div>

        <div className="p-5">
          {cameraError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {cameraError}
            </div>
          )}

          {/* Video feed */}
          <div
            className="relative mx-auto mb-4 overflow-hidden rounded-xl bg-gray-900"
            style={{ maxWidth: 480, aspectRatio: "4/3" }}
          >
            <video
              ref={videoRef}
              className="h-full w-full object-cover"
              muted
              playsInline
            />
            <canvas ref={canvasRef} className="hidden" />
            {!cameraActive && (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                {cameraError ? "Camera unavailable" : "Camera off"}
              </div>
            )}
            {cameraActive && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="relative h-48 w-48">
                  <span className="absolute left-0 top-0 h-8 w-8 border-l-4 border-t-4 border-teal-400 rounded-tl-lg" />
                  <span className="absolute right-0 top-0 h-8 w-8 border-r-4 border-t-4 border-teal-400 rounded-tr-lg" />
                  <span className="absolute left-0 bottom-0 h-8 w-8 border-l-4 border-b-4 border-teal-400 rounded-bl-lg" />
                  <span className="absolute right-0 bottom-0 h-8 w-8 border-r-4 border-b-4 border-teal-400 rounded-br-lg" />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-center gap-3">
            {!cameraActive ? (
              <button
                onClick={startCamera}
                className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-teal-800 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 7l-7 5 7 5V7z" />
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                </svg>
                Start Camera
              </button>
            ) : (
              <button
                onClick={stopCamera}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Stop Camera
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Manual entry */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-gray-900">Manual Lookup</h2>
          <p className="mt-0.5 text-xs text-gray-500">
            Type the reference number printed on the ID card.
          </p>
        </div>
        <div className="p-5">
          <div className="flex gap-2">
            <input
              type="text"
              value={manualRef}
              onChange={(e) => setManualRef(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === "Enter" && manualRef.trim()) {
                  lookupRef(manualRef.trim());
                }
              }}
              placeholder="e.g. APP-2026-0042"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono outline-none focus:border-teal-500"
            />
            <button
              onClick={() => manualRef.trim() && lookupRef(manualRef.trim())}
              disabled={loading || !manualRef.trim()}
              className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-50 transition-colors"
            >
              {loading ? "…" : "Lookup"}
            </button>
          </div>
        </div>
      </div>

      {/* Result card */}
      {result && (
        <div
          className={`overflow-hidden rounded-2xl border shadow-sm ${
            result.error
              ? "border-red-200 bg-red-50"
              : result.alreadyScanned
                ? "border-amber-200 bg-amber-50"
                : "border-teal-200 bg-teal-50"
          }`}
        >
          <div
            className={`flex items-center justify-between border-b px-5 py-3 ${
              result.error
                ? "border-red-200"
                : result.alreadyScanned
                  ? "border-amber-200"
                  : "border-teal-200"
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-sm font-bold ${
                  result.error
                    ? "bg-red-200 text-red-700"
                    : result.alreadyScanned
                      ? "bg-amber-200 text-amber-700"
                      : "bg-teal-200 text-teal-700"
                }`}
              >
                {result.error ? "✕" : result.alreadyScanned ? "↩" : "✓"}
              </span>
              <span className="text-sm font-semibold text-gray-900">
                {result.error
                  ? "Not Found"
                  : result.alreadyScanned
                    ? "Already Scanned Today"
                    : "Attendance Recorded"}
              </span>
            </div>
            <button
              onClick={() => setResult(null)}
              className="rounded p-1 text-gray-400 hover:bg-white/50 hover:text-gray-600 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <div className="px-5 py-4">
            <p className="mb-1 text-xs font-mono text-gray-500">{result.refNumber}</p>
            {result.error ? (
              <p className="text-sm text-red-700">{result.error}</p>
            ) : (
              <div className="space-y-1.5">
                <p className="text-base font-semibold text-gray-900">{result.fullName}</p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-teal-100 px-2.5 py-0.5 font-medium text-teal-800">
                    {result.mission}
                  </span>
                  <span className="rounded-full bg-gray-100 px-2.5 py-0.5 font-medium text-gray-700">
                    {result.program}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 font-medium ${
                      result.status === "ENROLLED"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {result.status}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
