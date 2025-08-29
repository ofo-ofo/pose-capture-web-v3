import React, { useEffect, useRef, useState } from 'react';
import { initPoseLandmarker, type PoseResult } from '../../mediapipe/pose';
import { getBaseUrl } from '../../mediapipe/wasm-config';
import {
  computeRollDeg,
  computeCenterOffset,
  computeHeightRatio,
  computeMargins,
  estimateLuma
} from '../../metrics/compute';
import { evaluate, Thresholds } from '../../metrics/thresholds';
import { ema } from '../../metrics/smooth';
import { drawOverlay } from '../../utils/canvas';

/**
 * TestFeed page allows simulation using a pre-recorded MP4 file.
 * There is no auto-capture here; the pipeline simply evaluates each frame and displays metrics.
 */
const TestFeed: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [landmarker, setLandmarker] = useState<null | { detect: (src: any) => Promise<PoseResult>; close: () => void }>(null);
  const [thresholds] = useState<Thresholds>({
    rollMaxDeg: 4.0,
    centerOffsetMax: 0.08,
    heightRatioMin: 0.75,
    topMarginMin: 0.03,
    bottomMarginMin: 0.03,
    lumaMin: 30,
    stabilityFrames: 10,
    presenceMin: 0.5
  });
  const emaRef = useRef<{ roll: number | null; center: number | null; height: number | null; top: number | null; bottom: number | null; luma: number | null }>({
    roll: null,
    center: null,
    height: null,
    top: null,
    bottom: null,
    luma: null
  });
  const [status, setStatus] = useState<{ level: 'green' | 'amber' | 'red'; reasons: string[] }>({
    level: 'red',
    reasons: []
  });

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (fileUrl) URL.revokeObjectURL(fileUrl);
    const url = URL.createObjectURL(file);
    setFileUrl(url);
    if (!landmarker) {
      const baseUrl = getBaseUrl();
      const lm = await initPoseLandmarker({ baseUrl, model: 'lite', simdPreferred: true, selfieMode: false });
      setLandmarker(lm);
    }
  };

  // Processing loop for the video file
  useEffect(() => {
    if (!fileUrl || !videoRef.current || !landmarker) return;
    let rafId: number;
    let cancelled = false;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const tick = async () => {
      if (cancelled) return;
      if (videoRef.current && landmarker) {
        if (!videoRef.current.paused && !videoRef.current.ended) {
          const result = await landmarker.detect(videoRef.current);
          const { landmarks, presence } = result;
          let metrics = { rollDeg: 0, center: 0, height: 0, top: 0, bottom: 0, luma: 0, presence };
          if (landmarks) {
            metrics.rollDeg = computeRollDeg(landmarks);
            metrics.center = computeCenterOffset(landmarks, videoRef.current.videoWidth);
            metrics.height = computeHeightRatio(landmarks, videoRef.current.videoHeight);
            const { top, bottom } = computeMargins(landmarks, videoRef.current.videoHeight);
            metrics.top = top;
            metrics.bottom = bottom;
          }
          metrics.luma = await estimateLuma(videoRef.current);
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
            presence: metrics.presence
          };
          const evalRes = evaluate(smoothed, thresholds);
          setStatus({ level: evalRes.level, reasons: evalRes.reasons });
          if (canvas && ctx) {
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const colour = evalRes.level === 'green' ? '#22c55e' : evalRes.level === 'amber' ? '#f59e0b' : '#ef4444';
            drawOverlay(ctx, colour, canvas.width, canvas.height);
          }
        }
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
    };
  }, [fileUrl, landmarker]);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Test Beslemesi</h2>
      <input type="file" accept="video/mp4" onChange={onFileChange} className="p-2 border rounded" />
      {fileUrl && (
        <div className="relative w-full max-w-screen-sm mx-auto">
          <video
            ref={videoRef}
            src={fileUrl}
            controls
            className="w-full h-auto rounded"
          />
          <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />
        </div>
      )}
      {fileUrl && (
        <div className="mt-4 p-4 border rounded bg-white shadow">
          <div className="flex space-x-4 flex-wrap">
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
            <span className={status.level === 'green' ? 'text-green-600' : status.level === 'amber' ? 'text-amber-600' : 'text-red-600'}>
              {status.level.toUpperCase()}
            </span>
          </div>
          {status.reasons.length > 0 && (
            <div className="text-sm text-gray-500">{status.reasons.join(', ')}</div>
          )}
        </div>
      )}
    </div>
  );
};

export default TestFeed;