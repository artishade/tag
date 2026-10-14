import React, { useState, useRef, useEffect } from "react";
import { MediaItem as MediaItemType } from "../store/mediaStore";
import { useMediaStore } from "../store/mediaStore";
import WatermarkControls from "./WatermarkControls";
import LogoUploader from "./LogoUploader";
import { useImageProcessor } from "../hooks/useImageProcessor";
import { useVideoProcessor } from "../hooks/useVideoProcessor";

interface MediaItemProps {
  item: MediaItemType;
  isSelected: boolean;
  onSelect: () => void;
}

const MediaItem: React.FC<MediaItemProps> = ({ item, isSelected, onSelect }) => {
  const { processImage } = useImageProcessor();
  const { processVideo } = useVideoProcessor();
  const removeFile = useMediaStore((s) => s.removeFile);
  const updateWatermark = useMediaStore((s) => s.updateWatermark);
  const updateLogo = useMediaStore((s) => s.updateLogo);

  const [showControls, setShowControls] = useState(false);
  const fileSizeMB = Math.round((item.file.size / (1024 * 1024)) * 100) / 100;

  const handleApplyWatermark = async () => {
    if (item.type === "image") {
      await processImage(item.id, item.url);
    } else {
      await processVideo(item.id, item.file);
    }
  };

  const handleRemove = () => {
    removeFile(item.id);
  };

  const isProcessing = item.status === "processing";
  const isDone = item.status === "done";
  const hasOverlay = item.watermark.text || item.logo.file;

  return (
    <div
      className={`border-2 rounded-xl overflow-hidden bg-white cursor-pointer transition-all ${
        isSelected
          ? "border-blue-500 shadow-lg ring-2 ring-blue-200"
          : "border-gray-200 hover:border-gray-300 hover:shadow-md"
      }`}
      onClick={onSelect}
    >
      {/* Media preview */}
      <div className="relative aspect-video bg-gray-100 flex items-center justify-center">
        {item.type === "video" ? (
          <video
            src={item.url}
            className="w-full h-full object-contain"
            muted
            preload="metadata"
          />
        ) : (
          <img
            src={item.url}
            alt={item.file.name}
            className="w-full h-full object-contain"
          />
        )}

        {/* Status overlay */}
        {item.status === "processing" && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="text-white text-center">
              <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full mx-auto mb-2" />
              <span className="text-sm">Processing...</span>
            </div>
          </div>
        )}

        {item.status === "error" && (
          <div className="absolute top-2 right-2 bg-red-100 text-red-600 px-2 py-1 rounded text-xs">
            Error
          </div>
        )}

        {/* Watermark + Logo overlay on preview (visual only) */}
        {hasOverlay && item.url && (
          <OverlayPreview item={item} />
        )}

        {/* File info badge */}
        <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
          {item.type === "video" ? "📹 Video" : "🖼️ Image"} • {fileSizeMB} MB
        </div>
      </div>

      {/* Controls area */}
      <div className="p-3">
        <p className="text-sm font-medium text-gray-700 truncate" title={item.file.name}>
          {item.file.name}
        </p>

        <div className="flex items-center justify-between mt-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowControls(!showControls);
            }}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            {showControls ? "Hide Controls ▲" : "Show Controls ▼"}
          </button>

          {item.processedUrl && (
            <span className="text-xs text-green-600">✓ Ready</span>
          )}
        </div>

        {showControls && isSelected && (
          <div className="mt-3 space-y-4 pt-3 border-t">
            <WatermarkControls
              watermark={item.watermark}
              onChange={(patch) => updateWatermark(item.id, patch)}
            />
            <LogoUploader
              logo={item.logo}
              onChange={(patch) => updateLogo(item.id, patch)}
            />

            <div className="flex gap-2 pt-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleApplyWatermark();
                }}
                disabled={isProcessing || !hasOverlay}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded disabled:opacity-50 disabled:cursor-not-allowed ${
                  hasOverlay
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                {isProcessing
                  ? "Processing..."
                  : isDone
                  ? "Re-apply"
                  : "Apply Watermark"}
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove();
                }}
                className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded"
                title="Remove"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Download button when processed */}
        {item.processedUrl && (
          <div className="mt-3 pt-3 border-t">
            <button
              onClick={async (e) => {
                e.stopPropagation();
                const response = await fetch(item.processedUrl!);
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                const ext = item.type === "video" ? "mp4" : "png";
                a.download = item.file.name.replace(/\.[^.]+$/, "") + "_watermarked." + ext;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="w-full px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700"
            >
              ↓ Download
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Renders a canvas-based preview of the watermark + logo overlay.
 * This is purely visual — the real processing happens on the hidden canvas
 * when the user clicks "Apply Watermark".
 */
const OverlayPreview: React.FC<{ item: MediaItemType }> = ({ item }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Only draw overlay if there are settings
      if (!item.watermark.text && !item.logo.file) return;

      // Draw watermark text
      if (item.watermark.text) {
        ctx.globalAlpha = item.watermark.opacity;
        ctx.fillStyle = item.watermark.color;
        ctx.font = `bold ${Math.min(24, item.watermark.fontSize)}px Inter, sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText(item.watermark.text, canvas.width / 2, 40);
      }

      // Draw logo placeholder if set
      if (item.logo.file && item.logo.dataUrl) {
        const logoImg = new Image();
        logoImg.onload = () => {
          ctx.globalAlpha = item.logo.opacity;
          ctx.drawImage(
            logoImg,
            10,
            10,
            80,
            80
          );
        };
        logoImg.src = item.logo.dataUrl;
      }
    };
    img.src = item.url;
  }, [item.watermark, item.logo, item.url]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full object-contain opacity-30 pointer-events-none"
      style={{ objectFit: "contain" }}
    />
  );
};

export default MediaItem;
