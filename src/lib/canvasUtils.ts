/**
 * Canvas utilities for applying watermark + logo overlays to images.
 */

/**
 * Draws a text watermark at the specified position.
 */
export function drawWatermark(
  ctx: CanvasRenderingContext2D,
  text: string,
  fontSize: number,
  opacity: number,
  color: string,
  x: number,
  y: number,
  position: "top-left" | "top-right" | "center" | "bottom-left" | "bottom-right"
): void {
  if (!text) return;

  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.fillStyle = color;
  ctx.font = `bold ${fontSize}px Inter, sans-serif`;
  ctx.textAlign = position.endsWith("right") ? "right" : position === "center" ? "center" : "left";
  ctx.textBaseline = position.startsWith("bottom") ? "bottom" : position === "center" ? "middle" : "top";
  ctx.textRendering = "optimizeLegibility";

  // Draw with a subtle shadow for readability
  ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
  ctx.shadowBlur = 3;
  ctx.fillText(text, x, y);

  ctx.restore();
}

/**
 * Draws a logo image at the specified position and scale.
 */
export function drawLogo(
  ctx: CanvasRenderingContext2D,
  logoImg: HTMLImageElement,
  scale: number, // 0–1 relative to canvas width
  opacity: number,
  rotation: number, // degrees
  x: number,
  y: number,
  position: "top-left" | "top-right" | "center" | "bottom-left" | "bottom-right"
): void {
  if (!logoImg.complete && logoImg.naturalWidth === 0) return;

  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.translate(x, y);
  ctx.rotate((rotation * Math.PI) / 180);

  const logoWidth = logoImg.naturalWidth;
  const logoHeight = logoImg.naturalHeight;
  const maxWidth = 400; // cap logo rendering width for processing
  const aspect = logoWidth / logoHeight;

  let drawW: number;
  let drawH: number;
  if (logoWidth > logoHeight) {
    drawW = Math.min(logoWidth, maxWidth);
    drawH = drawW / aspect;
  } else {
    drawH = Math.min(logoHeight, maxWidth);
    drawW = drawH * aspect;
  }

  ctx.drawImage(logoImg, -drawW / 2, -drawH / 2, drawW, drawH);
  ctx.restore();
}

/**
 * Calculates the pixel position for a given anchor position.
 * Returns the center point used for centering the watermark/logo.
 */
export function calculatePosition(
  canvasWidth: number,
  canvasHeight: number,
  position: "top-left" | "top-right" | "center" | "bottom-left" | "bottom-right",
  customX?: number, // 0–1
  customY?: number // 0–1
): { x: number; y: number } {
  if (customX !== undefined && customY !== undefined) {
    return { x: canvasWidth * customX, y: canvasHeight * customY };
  }

  const margin = 20;
  switch (position) {
    case "top-left":
      return { x: margin, y: margin };
    case "top-right":
      return { x: canvasWidth - margin, y: margin };
    case "center":
      return { x: canvasWidth / 2, y: canvasHeight / 2 };
    case "bottom-left":
      return { x: margin, y: canvasHeight - margin };
    case "bottom-right":
    default:
      return { x: canvasWidth - margin, y: canvasHeight - margin };
  }
}

/**
 * Applies watermark + logo to an image and returns a data URL.
 * @param sourceUrl - Object URL of the source image
 * @param watermark - text watermark settings
 * @param logoSettings - logo overlay settings (file/dataUrl)
 * @param maxWidth - optional max canvas width (for large images)
 */
export async function applyWatermarkToImage(
  sourceUrl: string,
  watermark: {
    text: string;
    fontSize: number;
    opacity: number;
    color: string;
    position: "top-left" | "top-right" | "center" | "bottom-left" | "bottom-right";
    customX?: number;
    customY?: number;
  },
  logoSettings: {
    dataUrl: string | null;
    scale: number;
    opacity: number;
    position: "top-left" | "top-right" | "center" | "bottom-left" | "bottom-right";
    customX?: number;
    customY?: number;
    rotation: number;
  },
  maxWidth: number = 2000
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const scale = Math.min(maxWidth / img.naturalWidth, 1);
      const canvasWidth = img.naturalWidth * scale;
      const canvasHeight = img.naturalHeight * scale;

      const canvas = document.createElement("canvas");
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }

      // Draw the source image
      ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);

      // Draw watermark
      const wmPos = calculatePosition(
        canvasWidth,
        canvasHeight,
        watermark.position,
        watermark.customX,
        watermark.customY
      );
      drawWatermark(ctx, watermark.text, watermark.fontSize * scale, watermark.opacity, watermark.color, wmPos.x, wmPos.y, watermark.position);

      // Draw logo if available
      if (logoSettings.dataUrl) {
        const logoImg = new Image();
        logoImg.crossOrigin = "anonymous";
        logoImg.onload = () => {
          const logoPos = calculatePosition(
            canvasWidth,
            canvasHeight,
            logoSettings.position,
            logoSettings.customX,
            logoSettings.customY
          );
          drawLogo(ctx, logoImg, logoSettings.scale, logoSettings.opacity, logoSettings.rotation, logoPos.x, logoPos.y, logoSettings.position);

          const dataUrl = canvas.toDataURL("image/png");
          URL.revokeObjectURL(sourceUrl);
          resolve(dataUrl);
        };
        logoImg.onerror = () => {
          // Logo failed to load — just skip it
          const dataUrl = canvas.toDataURL("image/png");
          URL.revokeObjectURL(sourceUrl);
          resolve(dataUrl);
        };
        logoImg.src = logoSettings.dataUrl;
      } else {
        const dataUrl = canvas.toDataURL("image/png");
        URL.revokeObjectURL(sourceUrl);
        resolve(dataUrl);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(sourceUrl);
      reject(new Error("Failed to load image"));
    };
    img.src = sourceUrl;
  });
}

/**
 * Loads an image file and returns it as a data URL.
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
