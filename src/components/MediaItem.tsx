import React, { useState, useRef, useEffect } from "react";
import { MediaItem as MediaItemType } from "../store/mediaStore";
import { useMediaStore } from "../store/mediaStore";
import WatermarkControls from "./WatermarkControls";
import LogoUploader from "./LogoUploader";
import PreviewModal from "./PreviewModal";
import { useImageProcessor } from "../hooks/useImageProcessor";
import { useVideoProcessor } from "../hooks/useVideoProcessor";
import { calculatePosition, drawWatermark, drawLogo } from "../lib/canvasUtils";

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
  const applyToAll = useMediaStore((s) => s.applyToAll);
  const itemCount = useMediaStore((s) => s.items.length);

  const [showControls, setShowControls] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
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
    <>
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

        {/* Watermark + Logo overlay on preview */}
        {hasOverlay && item.url && (
          <InteractiveOverlay
            item={item}
            isSelected={isSelected}
            showControls={showControls}
          />
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

              {/* Preview button — shows full-fidelity preview modal */}
              {hasOverlay && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowPreview(true);
                  }}
                  className="px-3 py-2 text-xs text-indigo-600 hover:bg-indigo-50 rounded border border-indigo-200"
                  title="Preview watermark + logo placement"
                >
                  👁️ Preview
                </button>
              )}

              {/* Apply to All — copies this item's watermark + logo to all other items */}
              {itemCount > 1 && hasOverlay && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    applyToAll("both", item.id);
                  }}
                  className="px-3 py-2 text-xs text-purple-600 hover:bg-purple-50 rounded border border-purple-200"
                  title="Apply current settings to all media"
                >
                  ↗ Apply to All
                </button>
              )}

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

    {showPreview && <PreviewModal item={item} onClose={() => setShowPreview(false)} />}
    </>
  );
};

/**
 * Renders a canvas-based preview of the watermark + logo overlay.
 * When a logo is present and the item is selected with controls open,
 * the logo is draggable — dragging updates customX/customY in the store.
 */
interface InteractiveOverlayProps {
  item: MediaItemType;
  isSelected: boolean;
  showControls: boolean;
}

const InteractiveOverlay: React.FC<InteractiveOverlayProps> = ({
  item,
  isSelected,
  showControls,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const logoImgRef = useRef<HTMLImageElement | null>(null);
  const draggingRef = useRef(false);

  const updateLogo = useMediaStore((s) => s.updateLogo);

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

  // Draw the overlay preview
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const displayWidth = canvas.offsetWidth;
    const displayHeight = canvas.offsetHeight;

    // We draw at display size for preview
    const w = displayWidth;
    const h = displayHeight;
    if (w === 0 || h === 0) return;

    canvas.width = w;
    canvas.height = h;
    ctx.clearRect(0, 0, w, h);

    // Only draw overlay if there are settings
    if (!item.watermark.text && !item.logo.file) return;

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
        Math.min(32, item.watermark.fontSize),
        item.watermark.opacity,
        item.watermark.color,
        wmPos.x,
        wmPos.y,
        item.watermark.position
      );
    }

    // Draw logo if available and loaded
    if (item.logo.file && item.logo.dataUrl && logoLoaded && logoImgRef.current) {
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
  }, [item.watermark, item.logo, item.url, logoLoaded]);

  const canDrag = isSelected && showControls && !!item.logo.file;

  // Track the container's display dimensions for hit-area positioning
  const [containerSize, setContainerSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

  // Measure container dimensions on resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setContainerSize({
          w: containerRef.current.offsetWidth,
          h: containerRef.current.offsetHeight,
        });
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Compute logo pixel position for the drag hit area
  const logoPixelPos =
    canDrag && containerSize.w > 0
      ? calculatePosition(
          containerSize.w,
          containerSize.h,
          item.logo.position,
          item.logo.customX,
          item.logo.customY
        )
      : null;

  const logoHitSize = canDrag && containerSize.w > 0
    ? Math.min(120, item.logo.scale * containerSize.w)
    : 0;

  // Drag handling — document-level listeners for drag tracking
  useEffect(() => {
    if (!canDrag || !logoPixelPos) return;

    const handleMouseDown = (e: MouseEvent) => {
      const dist = Math.sqrt(
        Math.pow(e.clientX - logoPixelPos.x, 2) + Math.pow(e.clientY - logoPixelPos.y, 2)
      );

      if (dist > logoHitSize) return; // click was not near the logo

      e.stopPropagation(); // prevent parent onClick (selection) from firing
      draggingRef.current = true;
      e.preventDefault();
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!draggingRef.current) return;

      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Convert to relative (0–1) coordinates
      const relX = Math.max(0, Math.min(1, x / rect.width));
      const relY = Math.max(0, Math.min(1, y / rect.height));

      updateLogo(item.id, { customX: relX, customY: relY });
    };

    const handleMouseUp = () => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
    };

    containerRef.current?.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mousemove", handleMouseMove, { passive: false });
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      containerRef.current?.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [canDrag, logoPixelPos, logoHitSize, item.id, updateLogo]);

  return (
    <div
      ref={containerRef}
      className="absolute top-0 left-0 w-full h-full"
      style={{ pointerEvents: "none" }}
    >
      {/* Visual canvas — always pointer-events: none so clicks pass through */}
      <canvas
        ref={canvasRef}
        className="w-full h-full opacity-70"
        style={{ objectFit: "contain" }}
      />

      {/* Transparent drag hit-area for the logo — only when editable */}
      {canDrag && logoPixelPos && (
        <div
          className="absolute border-2 border-dashed border-blue-400 rounded-full"
          style={{
            left: `${logoPixelPos.x - logoHitSize / 2}px`,
            top: `${logoPixelPos.y - logoHitSize / 2}px`,
            width: `${logoHitSize}px`,
            height: `${logoHitSize}px`,
            pointerEvents: "auto",
            cursor: "grab",
          }}
        />
      )}
    </div>
  );
};

export default MediaItem;
