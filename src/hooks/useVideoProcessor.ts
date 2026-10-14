import { useCallback, useState } from "react";
import { useMediaStore } from "../store/mediaStore";

let ffmpegInstance: any = null;
let ffmpegLoading: Promise<any> | null = null;

/**
 * Lazily loads ffmpeg.wasm only when needed (heavy ~20MB bundle).
 */
async function loadFFmpeg(): Promise<any> {
  if (ffmpegInstance) return ffmpegInstance;
  if (ffmpegLoading) return ffmpegLoading;

  ffmpegLoading = (async () => {
    const { FFmpeg } = await import("@ffmpeg/ffmpeg");
    const ffmpeg = new FFmpeg();
    await ffmpeg.load();
    ffmpegInstance = ffmpeg;
    return ffmpeg;
  })();

  return ffmpegLoading;
}

/**
 * Converts a File to Uint8Array for ffmpeg's virtual FS.
 */
function fileToUint8Array(file: File): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const arrayBuffer = reader.result as ArrayBuffer;
      resolve(new Uint8Array(arrayBuffer));
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Hook for processing videos: applies text watermark + logo overlay via ffmpeg.wasm.
 */
export function useVideoProcessor() {
  const setStatus = useMediaStore((s) => s.setStatus);
  const setProcessedUrl = useMediaStore((s) => s.setProcessedUrl);
  const [progress, setProgress] = useState<number>(0);

  const processVideo = useCallback(
    async (id: string, file: File) => {
      const item = useMediaStore.getState().items.find((i) => i.id === id);
      if (!item) return;

      setStatus(id, "processing");
      setProgress(0);

      let ffmpeg: any;
      try {
        ffmpeg = await loadFFmpeg();
      } catch (err) {
        console.error("Failed to load ffmpeg:", err);
        setStatus(id, "error");
        return;
      }

      const inputName = "input.mp4";
      const outputName = "output.mp4";
      const logoName = "logo.png";

      try {
        // Write input file to ffmpeg's virtual FS
        ffmpeg.FS("writeFile", inputName, await fileToUint8Array(file));

        const watermark = item.watermark;
        const logo = item.logo;

        const filters: string[] = [];

        // Text watermark filter
        if (watermark.text) {
          const { x, y } = getTextPosition(watermark);
          const fontSize = Math.round(watermark.fontSize);
          const color = watermark.color.replace("#", "0x");
          const fontAlpha = Math.round(watermark.opacity * 255).toString(16).padStart(2, "0");

          filters.push(
            `drawtext=text='${watermark.text}':fontsize=${fontSize}:fontcolor=${color}${fontAlpha}:x=${x}:y=${y}:box=1:boxcolor=black@0.3:boxborderw=5`
          );
        }

        // Logo overlay filter
        if (logo.dataUrl && logo.file) {
          const logoData = await fetch(logo.dataUrl).then((r) => r.arrayBuffer());
          ffmpeg.FS("writeFile", logoName, new Uint8Array(logoData));

          const { x, y } = getLogoPosition(logo);

          // Scale logo: logo.scale (0.1–2) is relative to video width
          // We use a fixed max size of 300px as baseline — scale factor adjusts from there
          // This is a reasonable approximation for most video sizes
          const baseLogoSize = 300;
          const logoSize = Math.round(baseLogoSize * logo.scale);

          // Build the logo filter chain: scale → rotate → opacity
          const logoFilters = [`scale=${logoSize}:-1`];

          // Rotation (convert degrees to radians for ffmpeg rotate filter)
          if (logo.rotation % 360 !== 0) {
            const rad = (logo.rotation * Math.PI) / 180;
            logoFilters.push(`rotate=${rad}:bilinear=0`);
          }

          // Opacity via lut on alpha channel (lut=a=val*opacity)
          if (logo.opacity < 1) {
            logoFilters.push(`lut=a=val*${logo.opacity}`);
          }

          filters.push(
            `movie=${logoName}[logo];[logo]${logoFilters.join(",")}[logo];[in][logo]overlay=${x}:${y}:format=auto`
          );
        }

        const vf = filters.join(",");

        const cmd: string[] = ["-i", inputName];
        if (vf) {
          cmd.push("-vf", vf);
        }
        cmd.push("-preset", "ultrafast", outputName);

        // Run ffmpeg with progress callback
        await ffmpeg.run(...cmd);

        // Read the output
        const data = ffmpeg.FS("readFile", outputName);
        const blob = new Blob([data.buffer], { type: "video/mp4" });
        const processedUrl = URL.createObjectURL(blob);

        setProcessedUrl(id, processedUrl);
        setStatus(id, "done");
        setProgress(100);

        // Clean up virtual FS
        ffmpeg.FS("unlink", inputName);
        ffmpeg.FS("unlink", outputName);
        if (logo.dataUrl && logo.file) {
          try {
            ffmpeg.FS("unlink", logoName);
          } catch {}
        }
      } catch (err) {
        console.error("Video processing failed:", err);
        setStatus(id, "error");
      } finally {
        setProgress(0);
      }
    },
    [setStatus, setProcessedUrl]
  );

  return { processVideo, progress };
}

/**
 * Calculates text position for ffmpeg drawtext filter.
 * Returns ffmpeg-compatible x:y coordinate expressions.
 * Uses ffmpeg's built-in variables (w, h for text box; W, H for main video).
 */
function getTextPosition(
  watermark: {
    position: string;
    customX?: number;
    customY?: number;
  }
): { x: string; y: string } {
  // Custom position uses ffmpeg expressions referencing main input dimensions (W, H)
  if (watermark.customX !== undefined && watermark.customY !== undefined) {
    return {
      x: `W*${watermark.customX}`,
      y: `H*${watermark.customY}`,
    };
  }

  // Preset positions use ffmpeg expressions
  switch (watermark.position) {
    case "top-left":
      return { x: "10", y: "10" };
    case "top-right":
      return { x: "W-tw-10", y: "10" };
    case "center":
      return { x: "(W-tw)/2", y: "(H-th)/2" };
    case "bottom-left":
      return { x: "10", y: "H-th-10" };
    case "bottom-right":
    default:
      return { x: "W-tw-10", y: "H-th-10" };
  }
}

/**
 * Calculates logo position for ffmpeg overlay filter.
 * Uses ffmpeg's built-in variables (W, H for main; w, h for overlay).
 */
function getLogoPosition(
  logo: {
    position: string;
    customX?: number;
    customY?: number;
  }
): { x: string; y: string } {
  // Custom position uses ffmpeg expressions referencing main input dimensions (W, H)
  if (logo.customX !== undefined && logo.customY !== undefined) {
    return {
      x: `W*${logo.customX}`,
      y: `H*${logo.customY}`,
    };
  }

  switch (logo.position) {
    case "top-left":
      return { x: "10", y: "10" };
    case "top-right":
      return { x: "W-w-10", y: "10" };
    case "center":
      return { x: "(W-w)/2", y: "(H-h)/2" };
    case "bottom-left":
      return { x: "10", y: "H-h-10" };
    case "bottom-right":
    default:
      return { x: "W-w-10", y: "H-h-10" };
  }
}
