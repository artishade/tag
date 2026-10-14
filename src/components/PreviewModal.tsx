import React, { useState, useRef, useEffect, useCallback } from "react";
import { MediaItem as MediaItemType } from "../store/mediaStore";
import { calculatePosition, drawWatermark, drawLogo } from "../lib/canvasUtils";

interface PreviewModalProps {
  item: MediaItemType;
  onClose: () => void;
}

const PreviewModal: React.FC<PreviewModalProps> = ({ item, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const logoImgRef = useRef<HTMLImageElement | null>(null);
  const [logoLoaded, setLogoLoaded] = useState(false);

  // Preload logo image
  useEffect(() => {
    if (item.logo.dataUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => setLogoLoaded(true);
      img.src = item.logo.dataUrl;
      logoImgRef.current = img;
    } else {
      logoImgRef.current = null;
      setLogoLoaded(false);
    }
  }, [item.logo.dataUrl]);

  // Core draw function: renders source + watermark + logo onto the canvas
  const drawPreview = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    if (w === 0 || h === 0) return;

    ctx.clearRect(0, 0, w, h);

    const drawOverlays = () => {
      // Draw watermark text
      if (item.watermark.text) {
        const wmPos = calculatePosition(
          w,
          h,
          item.watermark.position,
          item.watermark.customX,
          item.watermark.customY
        );
        drawWatermark(
          ctx,
          item.watermark.text,
          item.watermark.fontSize,
          item.watermark.opacity,
          item.watermark.color,
          wmPos.x,
          wmPos.y,
          item.watermark.position
        );
      }

      // Draw logo
      if (
        item.logo.file &&
        item.logo.dataUrl &&
        logoLoaded &&
        logoImgRef.current
      ) {
        const logoPos = calculatePosition(
          w,
          h,
          item.logo.position,
          item.logo.customX,
          item.logo.customY
        );
        drawLogo(
          ctx,
          logoImgRef.current,
          item.logo.scale,
          item.logo.opacity,
          item.logo.rotation,
          logoPos.x,
          logoPos.y,
          item.logo.position
        );
      }
    };

    if (item.type === "image") {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const scale = Math.min(w / img.naturalWidth, h / img.naturalHeight);
        const drawW = img.naturalWidth * scale;
        const drawH = img.naturalHeight * scale;
        const offsetX = (w - drawW) / 2;
        const offsetY = (h - drawH) / 2;

        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
        drawOverlays();
      };
      img.src = item.url;
    } else {
      // Video: draw first frame via a temporary video element
      const video = document.createElement("video");
      video.crossOrigin = "anonymous";
      video.muted = true;
      video.playsInline = true;
      video.preload = "metadata";
      video.src = item.url;
      video.onloadeddata = () => {
        const vw = video.videoWidth;
        const vh = video.videoHeight;
        const scale = Math.min(w / vw, h / vh);
        const drawW = vw * scale;
        const drawH = vh * scale;
        const offsetX = (w - drawW) / 2;
        const offsetY = (h - drawH) / 2;

        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(video, offsetX, offsetY, drawW, drawH);
        drawOverlays();

        URL.revokeObjectURL(video.src);
      };
    }
  }, [item, logoLoaded]);

  // Set canvas resolution based on display size + DPR
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateSize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      drawPreview();
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, [drawPreview]);

  // Re-draw when watermark/logo settings change
  useEffect(() => {
    drawPreview();
  }, [item.watermark, item.logo, logoLoaded, drawPreview]);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        ref={containerRef}
        className="relative w-full max-w-5xl max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Canvas preview — fills the container width */}
        <canvas
          ref={canvasRef}
          className="w-full h-auto rounded-lg shadow-2xl"
        />

        {/* Controls overlay */}
        <div className="absolute top-4 right-4 flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg text-sm hover:bg-gray-700 transition-colors"
          >
            Close Preview
          </button>
        </div>

        {/* Instructions */}
        <div className="absolute bottom-4 left-4 text-xs text-gray-400">
          <p>• This preview shows the final output quality</p>
          <p>• Adjust settings in the controls below for live updates</p>
        </div>
      </div>
    </div>
  );
};

export default PreviewModal;