import React, { useCallback, useEffect, useRef, useState } from 'react';
import { initPoseLandmarker, type PoseResult } from '../../mediapipe/pose';
import { getBaseUrl } from '../../mediapipe/wasm-config';
import {
  computeRollDeg,
  computeCenterOffset,
  computeHeightRatio,
  computeMargins,
  estimateLuma,
} from '../../metrics/compute';
import { evaluate, type Thresholds } from '../../metrics/thresholds';
import { ema } from '../../metrics/smooth';
import { updateStability, captureFrame } from '../../capture/controller';
import { postCheck } from '../../capture/postCheck';
import { openCamera, switchCamera } from '../../camera/getUserMedia';
import { uploadCapture } from '../../firebase/uploader';
import { drawOverlay } from '../../utils/canvas';

/**
 * Capture page implements the main pose detection and auto-capture pipeline.
 * Users must click the start button to open the camera (required by iOS).
 */
const Capture: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [landmarker, setLandmarker] =
    useState<{ detect: (src: any) => Promise<PoseResult>; close: () => void } | null>(null);
  const [facing, setFacing] = useState<'user' | 'environment'>('environment');

  const [thresholds] = useState<Thresholds>({
    rollMaxDeg: 4.0,
    centerOffsetMax: 0.08,
    heightRatioMin: 0.75,
    topMarginMin: 0.03,
    bottomMarginMin: 0.03,
    lumaMin: 30,
    stabilityFrames: 10,
    presenceMin: 0.5,
  });

  const [status, setStatus] = useState<{ level: 'green' | 'amber' | 'red'; reasons: string[] }>({
    level: 'red',
    reasons: [],
  });
  const [message, setMessage] = useState<string>('');

  // Maintain exponential moving averages for metrics to smooth jitter
  const emaRef = useRef<{
    roll: number | null;
    center: number | null;
    height: number | null;
    top: number | null;
    bottom: number | null;
    luma: number | null;
  }>({
    roll: null,
    center: null,
    height: null,
    top: null,
    bottom: null,
    luma: null,
  });
  const greenCountRef = useRef<number>(0);

  const startCamera = useCallback(async () => {
    try {
      const str = await openCamera({ facing });
      setStream(str);
      if (videoRef.current) {
        // iOS/Safari için gerekli öznitelikler
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.muted = true;
        videoRef.current.autoplay = true;

        videoRef.current.srcObject = str;
        // Safari: srcObject atandıktan sonra play() çağrısı gerekir
        await videoRef.current.play();
      }
      const baseUrl = getBaseUrl();
      const lm = await initPoseLandmarker({
        baseUrl,
        model: 'lite',
        simdPreferred: true,
        selfieMode: facing === 'user',
      });
      setLandmarker(lm);
    } catch (err) {
      console.error(err);
      setMessage('Kamera açılamadı. Lütfen izinleri kontrol edin.');
    }
  }, [facing]);

  const onSwitchCamera = useCallback(async () => {
    if (!stream) return;
    const newFacing = facing === 'user' ? 'environment' : 'user';
    try {
      const newStream = await switchCamera(stream, newFacing);
      setFacing(newFacing);
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        await videoRef.current.play();
      }
      // landmarker'ı yeni selfieMode ile yeniden kur
      landmarker?.close();
      const baseUrl = getBaseUrl();
      const lm = await initPoseLandmarker({
        baseUrl,
        model: 'lite',
        simdPreferred: true,
        selfieMode: newFacing === 'user',
      });
      setLandmarker(lm);
    } catch (err) {
      console.error(err);
    }
  }, [stream, facing, landmarker]);

  // Main loop: runs pose detection and updates UI each animation frame
  useEffect(() => {
    if (!videoRef.current || !landmarker) return;
    let rafId: number;
    let cancelled = false;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');

    const tick = async () => {
      if (cancelled) return;
      if (videoRef.current && landmarker) {
        try {
          const result = await landmarker.detect(videoRef.current);
          const { landmarks, presence } = result;

          let metrics = {
            rollDeg: 0,
            center: 0,
            height: 0,
            top: 0,
            bottom: 0,
            luma: 0,
            presence,
          };

          if (landmarks) {
            metrics.rollDeg = computeRollDeg(landmarks);
            metrics.center = computeCenterOffset(landmarks, videoRef.current.videoWidth);
            metrics.height = computeHeightRatio(landmarks, videoRef.current.videoHeight);
            const { top, bottom } = computeMargins(landmarks, videoRef.current.videoHeight);
            metrics.top = top;
            metrics.bottom = bottom;
          }

          // brightness
          metrics.luma = await estimateLuma(videoRef.current);

          // EMA smoothing
          const alpha = 0.4;
          emaRef.current.roll = ema(emaRef.current.roll, metrics.rollDeg, alpha);
          emaRef.current.center = ema(emaRef.current.center, metrics.center, alpha);
          emaRef.current.height = ema(emaRef.current.height, metrics.height, alpha);
          emaRef.current.top = ema(emaRef.current.top, metrics.top, alpha);
          emaRef.current.bottom = ema(emaRef.current.bottom, metrics.bottom, alpha);
          emaRef.current.luma = ema(emaRef.current.luma, metrics.luma, alpha);

          const smoothed = {
            rollDeg: emaRef.current.roll ?? metrics.rollDeg,
            center: emaRef.current.center ?? metrics.center,
            height: emaRef.current.height ?? metrics.height,
            top: emaRef.current.top ?? metrics.top,
            bottom: emaRef.current.bottom ?? metrics.bottom,
            luma: emaRef.current.luma ?? metrics.luma,
            presence: metrics.presence,
          };

          const evalRes = evaluate(smoothed, thresholds);
          setStatus({ level: evalRes.level, reasons: evalRes.reasons });

          if (canvas && ctx) {
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const colour =
              evalRes.level === 'green'
                ? '#22c55e'
                : evalRes.level === 'amber'
                ? '#f59e0b'
                : '#ef4444';
            drawOverlay(ctx, colour, canvas.width, canvas.height);
          }

          // Stability / auto-capture
          const { greenCount, shouldCapture } = updateStability(
            evalRes.level,
            thresholds.stabilityFrames
          );
          greenCountRef.current = greenCount;

          if (shouldCapture) {
            greenCountRef.current = 0;
            const blob = await captureFrame(videoRef.current);

            const postRes = postCheck(smoothed, thresholds);
            if (postRes.ok) {
              setMessage('Fotoğraf kaydediliyor...');
              try {
                await uploadCapture(blob, {
                  rollDeg: smoothed.rollDeg,
                  center: smoothed.center,
                  height: smoothed.height,
                  top: smoothed.top,
                  bottom: smoothed.bottom,
                  luma: smoothed.luma,
                  presence: smoothed.presence,
                  green_frames: thresholds.stabilityFrames,
                  device: navigator.userAgent,
                  camera: facing,
                  app_version: import.meta.env.VITE_APP_VERSION || '',
                });
                setMessage('Fotoğraf yüklendi.');
              } catch (uploadErr) {
                console.error(uploadErr);
                setMessage('Yükleme sırasında hata oluştu.');
              }
            } else {
              setMessage(postRes.message || 'Çekim kriterlerine uymuyor.');
            }
          }
        } catch (err) {
          console.error(err);
        }
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
    };
  }, [landmarker, thresholds, facing]);

  return (
    <div className="space-y-4">
      {!stream && (
        <button
          className="px-4 py-2 bg-teal-600 text-white rounded"
          onClick={() => {
            setMessage('');
            startCamera();
          }}
        >
          Kamerayı Aç
        </button>
      )}

      {stream && (
        <div className="relative w-full max-w-screen-sm mx-auto">
          <video
            ref={videoRef}
            className="w-full h-auto rounded"
            playsInline
            muted
            autoPlay
          />
          <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />
        </div>
      )}

      {stream && (
        <div className="flex space-x-4">
          <button className="px-4 py-2 bg-gray-200 rounded" onClick={onSwitchCamera}>
            Kamera Değiştir
          </button>
          <button
            className="px-4 py-2 bg-gray-200 rounded"
            onClick={async () => {
              if (!videoRef.current) return;
              const blob = await captureFrame(videoRef.current);
              const smoothed = {
                rollDeg: emaRef.current.roll ?? 0,
                center: emaRef.current.center ?? 0,
                height: emaRef.current.height ?? 0,
                top: emaRef.current.top ?? 0,
                bottom: emaRef.current.bottom ?? 0,
                luma: emaRef.current.luma ?? 0,
                presence: 1,
              };
              const postRes = postCheck(smoothed, thresholds);
              if (postRes.ok) {
                setMessage('Manuel fotoğraf yükleniyor...');
                try {
                  await uploadCapture(blob, {
                    rollDeg: smoothed.rollDeg,
                    center: smoothed.center,
                    height: smoothed.height,
                    top: smoothed.top,
                    bottom: smoothed.bottom,
                    luma: smoothed.luma,
                    presence: smoothed.presence,
                    green_frames: thresholds.stabilityFrames,
                    device: navigator.userAgent,
                    camera: facing,
                    app_version: import.meta.env.VITE_APP_VERSION || '',
                  });
                  setMessage('Fotoğraf yüklendi.');
                } catch (err) {
                  console.error(err);
                  setMessage('Yükleme sırasında hata oluştu.');
                }
              } else {
                setMessage(postRes.message || 'Çekim kriterlerine uymuyor.');
              }
            }}
          >
            Manuel Çek
          </button>
        </div>
      )}

      {stream && (
        <div className="mt-4 p-4 border rounded bg-white shadow">
          <div className="flex space-x-4">
            <span>
              <strong>Düzlük:</strong> {emaRef.current.roll?.toFixed(1) ?? '-'}°
            </span>
            <span>
              <strong>Merkez:</strong> {emaRef.current.center?.toFixed(2) ?? '-'}
            </span>
            <span>
              <strong>Boy:</strong> {emaRef.current.height?.toFixed(2) ?? '-'}
            </span>
            <span>
              <strong>Üst Boşluk:</strong> {emaRef.current.top?.toFixed(2) ?? '-'}
            </span>
            <span>
              <strong>Alt Boşluk:</strong> {emaRef.current.bottom?.toFixed(2) ?? '-'}
            </span>
            <span>
              <strong>Işık:</strong> {emaRef.current.luma?.toFixed(0) ?? '-'}
            </span>
          </div>
          <div className="mt-2">
            <strong>Durum:</strong>{' '}
            <span
              className={
                status.level === 'green'
                  ? 'text-green-600'
                  : status.level === 'amber'
                  ? 'text-amber-600'
                  : 'text-red-600'
              }
            >
              {status.level.toUpperCase()}
            </span>
          </div>
          {status.reasons.length > 0 && (
            <div className="text-sm text-gray-500">{status.reasons.join(', ')}</div>
          )}
        </div>
      )}
      {message && <p className="mt-2 text-center text-sm text-gray-700">{message}</p>}
    </div>
  );
};

export default Capture;
