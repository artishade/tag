import { useCallback } from "react";
import { useMediaStore } from "../store/mediaStore";
import { applyWatermarkToImage } from "../lib/canvasUtils";

/**
 * Hook for processing images: applies watermark + logo overlay via canvas.
 */
export function useImageProcessor() {
  const setStatus = useMediaStore((s) => s.setStatus);
  const setProcessedUrl = useMediaStore((s) => s.setProcessedUrl);

  const processImage = useCallback(
    async (id: string, sourceUrl: string) => {
      const item = useMediaStore.getState().items.find((i) => i.id === id);
      if (!item) return;

      setStatus(id, "processing");

      try {
        const dataUrl = await applyWatermarkToImage(
          sourceUrl,
          item.watermark,
          item.logo,
          2000
        );

        // Convert data URL to blob → object URL
        const blob = dataURLToBlob(dataUrl);
        const processedUrl = URL.createObjectURL(blob);

        setProcessedUrl(id, processedUrl);
        setStatus(id, "done");
      } catch (err) {
        console.error("Image processing failed:", err);
        setStatus(id, "error");
      } finally {
        URL.revokeObjectURL(sourceUrl);
      }
    },
    [setStatus, setProcessedUrl]
  );

  return { processImage };
}

/**
 * Converts a data URL to a Blob.
 */
function dataURLToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(",");
  const mime = parts[0].match(/:(.*?);/)?.[1] || "image/png";
  const bstr = atob(parts[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}
