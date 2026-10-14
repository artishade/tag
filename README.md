# Tag — Media Watermark Dashboard

A beautiful, privacy-first web dashboard for uploading multiple media files (images & videos), adding custom watermark text and logo overlays, then downloading the processed results. All processing happens locally in the browser — no files are uploaded to any server.

## Features

- ✅ **Drag & Drop Upload** — Drop images & videos directly onto the dashboard (multiple files supported)
- ✅ **Text Watermark** — Add customizable text watermark (font size, color, opacity, position)
- ✅ **Logo Overlay** — Upload a logo image, position it, scale it, rotate it, set opacity
- ✅ **Drag-to-Position** — Drag the logo directly on the media preview to reposition it freely
- ✅ **Live Preview** — See the watermark + logo overlay on each media item in real-time via canvas overlay
- ✅ **Full Preview Modal** — Click the 👁️ Preview button to see a high-fidelity, full-canvas preview of your watermark + logo placement before processing
- ✅ **Apply to All** — Copy current item's settings (watermark + logo) to all other uploaded media
- ✅ **Batch Processing** — Apply watermarks to all uploaded media
- ✅ **Download Options** — Download individual files or get all processed media as a ZIP
- ✅ **Global Settings** — Set default watermark/logo settings that new uploads inherit automatically
- ✅ **Privacy-First** — All processing is done client-side. No files leave your browser.
- ✅ **Format Support** — Images: JPG, PNG, GIF, WebP, BMP, TIFF, SVG. Videos: MP4, WebM, AVI, MOV, MKV, WMV

## Tech Stack

- **React 19** + **TypeScript** — Modern, type-safe frontend
- **Vite** — Lightning-fast dev server & build tool
- **Tailwind CSS** — Utility-first styling
- **Zustand** — Lightweight state management with devtools
- **react-dropzone** — Drag & drop file handling
- **Canvas API** — Image watermarking (native, fast)
- **ffmpeg.wasm** — Video watermarking (lazy-loaded ~20MB, cached singleton)
- **JSZip + file-saver** — ZIP downloads for batch export
- **Google Fonts (Inter)** — Typography

## Getting Started

### Prerequisites

- Node.js 20+ ([download](https://nodejs.org/))
- npm, yarn, or pnpm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

This starts the Vite dev server at `http://localhost:5173` and opens the app in your default browser.

### Build

```bash
npm run build
```

Outputs production-ready files to the `dist/` directory.

### Preview

```bash
npm run preview
```

Starts a local server to preview the production build.

## Usage

### Quick Start

1. **Upload Media:**
   - Drag & drop image or video files onto the dashboard, OR
   - Click the upload zone to browse files
   - Supported formats: JPG, PNG, GIF, WebP, BMP, TIFF, SVG, MP4, WebM, AVI, MOV, MKV, WMV

2. **Configure Watermarks & Logo:**
   - Click on any media item (blue border appears) to select it
   - Click "Show Controls ▼" to open the settings panel
   - **Text Watermark:** Type text, adjust font size, color, opacity, and preset position
   - **Logo Overlay:** Upload a PNG logo, adjust scale, opacity, and rotation
   - **Drag-to-Position:** Drag the dashed circular handle on the media preview to reposition the logo freely. Custom X/Y coordinates update live in the controls panel. Click "Reset to preset" to return to the predefined position.

3. **Preview:**
   - Click 👁️ Preview to open a full-canvas modal showing exactly how the watermark and logo will appear on the final output

4. **Apply Watermark:**
   - Click "Apply Watermark" to process the media
   - Images process via Canvas API (fast)
   - Videos process via ffmpeg.wasm (loads on first use, caches for subsequent videos)
   - Status badges show progress: "Processing..." → "✓ Ready"

5. **Download:**
   - Click "↓ Download" on each item for individual files
   - Click "Download All as ZIP" at the bottom for all processed files as a single ZIP archive

### Working with Multiple Files

- **Apply to All:** When you have multiple media items and have configured watermark/logo on one, click "↗ Apply to All" to copy those settings to all other items
- **Global Settings:** Use the "Global Settings" panel (above the upload zone) to set default watermark and logo settings that new uploads will inherit automatically

## Project Structure

```
root/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── UploadZone.tsx          # Drag-drop file upload area with format/size validation
│   │   ├── MediaGrid.tsx           # Responsive grid layout of uploaded media items
│   │   ├── MediaItem.tsx           # Individual media editor with controls + interactive canvas overlay
│   │   ├── WatermarkControls.tsx   # Text watermark settings panel (text, size, opacity, color, position)
│   │   ├── LogoUploader.tsx        # Logo upload + scale/opacity/rotation/position controls
│   │   ├── GlobalControls.tsx      # Global default settings panel for new uploads
│   │   ├── DownloadSection.tsx     # Fixed bottom bar: individual downloads + ZIP batch export
│   │   └── PreviewModal.tsx        # Full-canvas preview modal with DPI-scaled rendering
│   ├── hooks/
│   │   ├── useImageProcessor.ts    # Canvas-based image watermarking (fast, native)
│   │   └── useVideoProcessor.ts    # ffmpeg.wasm-based video watermarking (lazy-loaded)
│   ├── lib/
│   │   └── canvasUtils.ts          # Canvas drawing utilities: drawWatermark, drawLogo, calculatePosition, applyWatermarkToImage
│   ├── store/
│   │   └── mediaStore.ts           # Zustand state management: items, global settings, mutations, URL lifecycle
│   ├── types/
│   │   └── globals.d.ts            # Type declarations for file-saver & react-dropzone fallbacks
│   ├── App.css                     # Custom CSS variables (color palette, scrollbar, spin animation)
│   ├── App.tsx                     # Root component: header, upload zone, global controls, grid, downloads
│   ├── index.css                   # Tailwind directives + custom font import (Inter)
│   └── main.tsx                    # ReactDOM entry point (React StrictMode)
├── .claude/
│   └── launch.json                 # Claude Code preview server config
├── .vercel/
│   ├── project.json                # Vercel deployment config
│   └── README.txt                  # Vercel project instructions
├── index.html                      # HTML entry (root div + module script)
├── package.json                    # Dependencies, scripts
├── tsconfig.json                   # TypeScript config (React 19, strict mode)
├── tsconfig.node.json              # Node-specific TS config (vite build tool)
├── vite.config.ts                  # Vite config (React plugin, auto-open)
├── tailwind.config.ts              # Tailwind config (content paths)
└── postcss.config.cjs              # PostCSS plugins (Tailwind, Autoprefixer)
```

### Architecture: Connection & Data Flow

The application follows a **unidirectional data-flow** architecture: a single
Zustand store owns all state, UI components read from it and dispatch mutations,
and processing hooks mutate state to reflect progress.

```
┌─────────────────────────────────────────────────────────────────────┐
│                            Zustand Store                             │
│  (src/store/mediaStore.ts)                                           │
│                                                                      │
│  state.items[]          ←── MediaItem[]                              │
│  state.globalWatermark  ←── Partial<WatermarkSettings>               │
│  state.globalLogo       ←── Partial<LogoSettings>                    │
│  state.selectedId       ←── string | null                            │
│                                                                      │
│  mutations:                                                         │
│    addFiles(files)          — create MediaItems, inherit globals    │
│    updateWatermark(id,p)    — patch one item's text settings        │
│    updateLogo(id,p)          — patch one item's logo settings        │
│    applyToAll(type,fromId)  — copy settings to every item           │
│    setProcessedUrl(id,url)  — store blob URL after processing        │
│    setStatus(id,status)     — idle / processing / done / error       │
│    setGlobalWatermark(p)    — update defaults for new uploads       │
│    setGlobalLogo(p)         — update defaults for new uploads        │
│    removeFile(id)           — revoke URLs, drop item                │
│    clearAll()               — revoke all URLs, reset store          │
└──────────┬──────────────────────────────────────────┬───────────────┘
           │ reads state                                │ dispatches mutations
           ▼                                              ▼
┌─────────────────────┐      ┌─────────────────┐  ┌─────────────────────┐
│  GlobalControls     │      │  UploadZone     │  │  MediaGrid          │
│  (default settings) │      │  (dropzone)     │  │  (grid container)   │
│  — calls            │      │  — calls        │  │  — renders          │
│    setGlobal*        │      │    addFiles     │  │    MediaItem[]      │
└─────────────────────┘      └─────────────────┘  └─────────┬───────────┘
                                                             │
                                                             │ renders + passes props
                                                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                             MediaItem                                   │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Media Preview                                                  │   │
│  │  — <img> or <video> element with native object URL             │   │
│  │  — status overlay (spinner / error badge / "✓ Ready")            │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  InteractiveOverlay (transparent canvas preview)               │   │
│  │   — calculatePosition / drawWatermark / drawLogo                │   │
│  │   — logo is draggable when selected + controls open             │   │
│  │   — drag updates customX/customY (0–1 relative coords) in store │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  Controls (WatermarkControls / LogoUploader):                          │   │
│   — onChange → updateWatermark / updateLogo                            │   │
│                                                                         │   |
│  Preview button (👁️):                                                  │   │
│   — opens PreviewModal with current settings                            │   │
│                                                                         │   │
│  "Apply Watermark" button:                                             │   │
│   — image  → useImageProcessor.processImage(id, item.url)             │   │
│   — video  → useVideoProcessor.processVideo(id, item.file)            │   │
│                                                                         │   │
│  "↗ Apply to All" button (when itemCount > 1):                          │   │
│   — applyToAll("both", id)                                             │   │
│                                                                         │   │
│  "↓ Download" button (when processedUrl exists):                       │   │
│   — fetch(processedUrl) → blob → anchor download                       │   │
└─────────────────────────────────────────────────────────────────────────┘
           ▲
           │
           │ PreviewModal (full-canvas preview, triggered from GlobalControls too)
           ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        PreviewModal                                     │
│  — Renders source image/video first frame on high-DPI canvas            │
│  — Overlays watermark + logo using same drawWatermark/drawLogo functions │
│  — For videos: draws first frame via temporary <video> element          │
│  — Provides full-fidelity preview before processing                      │
└─────────────────────────────────────────────────────────────────────────┘
           ▲
           │
           │ processing pipelines
           ▼
┌──────────────────────────┐    ┌───────────────────────────────────────┐
│ useImageProcessor        │    │ useVideoProcessor                       │
│ (src/hooks)              │    │ (src/hooks)                            │
│                          │    │                                       │
│ — applyWatermarkToImage  │    │ — loadFFmpeg() (lazy import, ~20 MB)  │
│   (src/lib/canvasUtils)  │    │   cached singleton                     │
│ — returns data URL       │    │ — writes input file to ffmpeg FS      │
│ — converts to blob URL   │    │ — builds drawtext + overlay filters    │
│ — setProcessedUrl        │    │   from watermark.settings / logo        │
│ — setStatus("done")      │    │ — ffmpeg.run({preset: ultrafast})      │
│                          │    │ — reads output from FS → blob URL     │
│ flow:                    │    │ — setProcessedUrl                      │
│  1. loadImage(sourceUrl) │    │ — setStatus("done")                    │
│  2. canvas.drawImage     │    │                                        │
│  3. drawWatermark        │    │ flow:                                  │
│  4. drawLogo (if any)    │    │  1. loadFFmpeg (singleton)            │
│  5. canvas.toDataURL     │    │  2. writeFile to virtual FS           │
│  6. dataURLToBlob        │    │  3. construct -vf chain                │
│  7. URL.createObjectURL   │    │  4. ffmpeg.run                         │
│  8. setProcessedUrl      │    │  5. readFile from virtual FS          │
└──────────────────────────┘    │  6. create blob URL                    │
                               └───────────────────────────────────────┘
                                     │
                                     │ setStatus("done")
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          DownloadSection                                  │
│  — filters items with processedUrl + status "done"                     │
│  — individual download (saveAs via file-saver)                         │
│  — batch ZIP (JSZip + file-saver)                                       │
└─────────────────────────────────────────────────────────────────────────┘
```

### Processing Logic

The application has two parallel processing pipelines — one for **images** (Canvas API)
and one for **videos** (ffmpeg.wasm) — that both consume the same `MediaItem`
settings and write results back to the store.

#### Image processing pipeline

```
User clicks "Apply Watermark" on an image item
  → useImageProcessor.processImage(id, item.url)
    → setStatus(id, "processing")
    → applyWatermarkToImage(sourceUrl, watermark, logo, maxWidth=2000)
        │  (src/lib/canvasUtils.ts)
        ├─ new Image() → onload fires
        ├─ compute scale = min(maxWidth / naturalWidth, 1)  [downscale large images]
        ├─ canvas.width  = naturalWidth  * scale
        ├─ canvas.height = naturalHeight * scale
        ├─ ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight)
        ├─ calculatePosition(canvasWidth, canvasHeight, position, customX, customY)
        ├─ drawWatermark(ctx, text, fontSize*scale, opacity, color, x, y, position)
        │     — fillText with shadow for readability, alpha-blended
        ├─ drawLogo(ctx, logoImg, scale, opacity, rotation, x, y, position)
        │     — if logo.dataUrl exists → new Image() → onload
        │     — translate → rotate → drawImage (centered, scaled to ≤400px)
        ├─ canvas.toDataURL("image/png")
        ├─ URL.revokeObjectURL(sourceUrl)  [cleanup]
        └─ resolve(dataUrl)
    → dataURLToBlob(dataUrl)
    → URL.createObjectURL(blob)
    → setProcessedUrl(id, processedUrl)
    → setStatus(id, "done")
```

#### Video processing pipeline

```
User clicks "Apply Watermark" on a video item
  → useVideoProcessor.processVideo(id, file)
    → setStatus(id, "processing")
    → loadFFmpeg()
        — lazy import("@ffmpeg/ffmpeg")  [~20MB, loaded once]
        — cached as module-level singleton (ffmpegInstance)
        — concurrent loads coalesced (ffmpegLoading promise)
    → ffmpeg.FS("writeFile", "input.mp4", fileToUint8Array(file))
    → build filter chain (src/hooks/useVideoProcessor.ts):
        if watermark.text:
          drawtext filter
            • color converted from "#rrggbb" → "0xrrggbb"
            • alpha from opacity → hex (e.g. 0.5 → "80")
            • position via getTextPosition() → ffmpeg expressions (W-tw-10, etc.)
            • box=1:boxcolor=black@0.3:boxborderw=5  [readability background]
        if logo.dataUrl:
          movie=logo.png[logo];[logo]scale→rotate→lut(a)[logo];[in][logo]overlay=x:y
            • scale relative to 300px baseline * logo.scale
            • rotate: degrees → radians
            • opacity via lut=a=val*opacity
            • position via getLogoPosition() → ffmpeg expressions
    → ffmpeg.run("-i", "input.mp4", "-vf", filters, "-preset", "ultrafast", "output.mp4")
    → ffmpeg.FS("readFile", "output.mp4")
    → blob = new Blob([data.buffer], { type: "video/mp4" })
    → URL.createObjectURL(blob)
    → setProcessedUrl(id, processedUrl)
    → setStatus(id, "done")
    → cleanup: ffmpeg.FS("unlink", ...) for input/output/logo
```

#### Position calculation

Both pipelines use the same positioning semantics via `calculatePosition()` (canvas)
and `getTextPosition()` / `getLogoPosition()` (ffmpeg):

| Position       | Canvas (pixels)                          | ffmpeg (expressions)        |
|----------------|------------------------------------------|-----------------------------|
| `top-left`     | `margin, margin` (20px)                  | `10, 10`                    |
| `top-right`    | `w - margin, margin`                     | `W - tw - 10, 10`           |
| `center`       | `w/2, h/2`                               | `(W - tw)/2, (H - th)/2`    |
| `bottom-left`  | `margin, h - margin`                     | `10, H - th - 10`           |
| `bottom-right` | `w - margin, h - margin` (default)       | `W - tw - 10, H - th - 10`  |
| custom         | `w * customX, h * customY`               | `W * customX, H * customY`  |

When `customX` and `customY` are defined (set via drag-to-position), they override
the preset position and are evaluated as relative coordinates (0–1).

#### Global vs per-item settings

- **Global settings** (`globalWatermark`, `globalLogo` in the store) are set via
  `GlobalControls`. New uploads inherit them at creation time
  (`addFiles` spreads `{ ...DEFAULT_WATERMARK, ...state.globalWatermark }`).
- Per-item settings can be edited individually via each `MediaItem`'s controls.
- `applyToAll("both", fromId)` copies the selected item's watermark + logo to
  every other item, overriding their individual settings.

#### Interactive overlay (live preview)

`InteractiveOverlay` inside `MediaItem` renders a transparent `<canvas>` over the
media preview. It:

1. Preloads the logo image on `dataUrl` change.
2. On every settings change (watermark or logo), redraws the canvas at display
   resolution using `drawWatermark` and `drawLogo`.
3. When the item is selected and controls are open, renders a draggable
   hit-area. Mouse events track the logo position and update `customX` / `customY`
  as relative (0–1) coordinates in the store, enabling drag-to-position.

#### PreviewModal (full-fidelity preview)

`PreviewModal` is a full-screen modal that provides a high-DPI preview of the
final output. Triggered from:
- Each `MediaItem` via the "👁️ Preview" button
- `GlobalControls` via "Preview Global Settings on ..." button

It renders the source media (image or video first frame) on a canvas scaled to
`devicePixelRatio`, then overlays the watermark and logo using the same
`drawWatermark` / `drawLogo` functions from `canvasUtils.ts`. This gives users
an accurate preview before processing.

## Use Cases

#### 1. Quick watermark on a single photo

1. Drag & drop a JPG into the upload zone.
2. Click the media item to select it (blue border appears).
3. Click "Show Controls ▼".
4. In **Text Watermark**, type "© 2024 MyBrand", set opacity to 70%, pick a color.
5. Click **Apply Watermark** — the canvas pipeline processes the image.
6. Click **↓ Download** — a PNG file `photo_watermarked.png` is saved.

#### 2. Branding a video with a logo

1. Drag & drop an MP4 file.
2. Click the item → Show Controls → **Logo Overlay** → Upload Logo (PNG).
3. Adjust Scale (30%), Opacity (80%), Rotation (0°), Position (bottom-right).
4. Click **Apply Watermark** — ffmpeg.wasm loads (once), processes the video.
5. Review the status badge: "✓ Ready".
6. Click **↓ Download** — an MP4 file is saved.

#### 3. Batch watermarking multiple images

1. Select 10 images in the upload zone (or drag all at once).
2. Configure watermark text + logo on the **first** item.
3. Click **↗ Apply to All** — settings propagate to all 9 other items.
   (This copies both watermark and logo settings.)
4. Click **Apply Watermark** on each item (or each one sequentially).
5. Once all show "✓ Ready", click **Download All as ZIP** at the bottom.
6. A `tag-media-watermarked.zip` is downloaded containing all processed files.

#### 4. Setting defaults for future uploads

1. Open **Global Settings** at the top of the page (above the upload zone).
2. Configure your standard watermark text, font size, color, opacity.
3. Upload your company logo and set scale/opacity/position.
4. Any new file you upload will **inherit** these global settings automatically.
5. Tip: Use Global Settings to establish your brand template, then tweak
   individual items as needed.

#### 5. Drag-to-reposition a logo

1. Upload a logo and apply it to any media item (image or video preview).
2. Select the item and open its controls.
3. Drag the dashed circular handle (centered on the logo) to any position
   on the preview.
4. The relative X/Y coordinates update live in the controls panel.
5. Click "Reset to preset" to return to the predefined position.

#### 6. Preview before processing

1. Configure your watermark text and/or logo on any media item.
2. Click the 👁️ **Preview** button.
3. The PreviewModal opens, showing a high-resolution canvas render of exactly
   how the final output will look.
4. Adjust settings and the preview updates live — close when satisfied.
5. Click **Apply Watermark** to generate the final file.

### Processing limits & constraints

- **Max files per session:** 50
- **Max file size:** 100 MB per file
- **Max logo size:** 5 MB
- **Max image output width:** 2000 px (downscaled automatically for faster canvas processing)
- **Video processing:** ffmpeg.wasm is lazy-loaded on first video process;
  subsequent videos reuse the cached instance.
- **Supported image formats:** JPG, PNG, GIF, WebP, BMP, TIFF, SVG
- **Supported video formats:** MP4, WebM, AVI, MOV, MKV, WMV

## License

MIT.
