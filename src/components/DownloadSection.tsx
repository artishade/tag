import React, { useState } from "react";
import { useMediaStore } from "../store/mediaStore";
import JSZip from "jszip";
import { saveAs } from "file-saver";

const DownloadSection: React.FC = () => {
  const items = useMediaStore((s) => s.items);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);

  // Only items that have been processed (have a processedUrl)
  const processedItems = items.filter(
    (i) => i.processedUrl && i.status === "done"
  );

  const downloadSingle = async (item: (typeof items)[0]) => {
    if (!item.processedUrl) return;

    try {
      const response = await fetch(item.processedUrl);
      const blob = await response.blob();
      const ext = item.type === "video" ? "mp4" : "png";
      const baseName = item.file.name.replace(/\.[^.]+$/, "");
      saveAs(blob, `${baseName}_watermarked.${ext}`);
    } catch (err) {
      console.error("Download failed:", err);
      alert("Failed to download. Please try again.");
    }
  };

  const downloadAllAsZip = async () => {
    if (processedItems.length === 0) return;

    setIsDownloadingAll(true);
    const zip = new JSZip();

    try {
      for (const item of processedItems) {
        if (!item.processedUrl) continue;

        const response = await fetch(item.processedUrl);
        const blob = await response.blob();
        const ext = item.type === "video" ? "mp4" : "png";
        const baseName = item.file.name.replace(/\.[^.]+$/, "");
        zip.file(`${baseName}_watermarked.${ext}`, blob);
      }

      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, "tag-media-watermarked.zip");
    } catch (err) {
      console.error("ZIP download failed:", err);
      alert("Failed to create ZIP. Please try again.");
    } finally {
      setIsDownloadingAll(false);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-800">
              Download Processed Media
            </h3>
            <p className="text-sm text-gray-500">
              {processedItems.length} of {items.length} files ready
            </p>
          </div>

          <div className="flex items-center gap-3">
            {processedItems.map((item) => (
              <button
                key={item.id}
                onClick={() => downloadSingle(item)}
                className="px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                title={item.file.name}
              >
                ↓
              </button>
            ))}

            <button
              onClick={downloadAllAsZip}
              disabled={isDownloadingAll || processedItems.length === 0}
              className={`px-4 py-2 text-sm font-medium text-white rounded transition-colors ${
                isDownloadingAll || processedItems.length === 0
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isDownloadingAll
                ? `Creating ZIP... (${processedItems.length} files)`
                : `Download All as ZIP (${processedItems.length})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DownloadSection;
