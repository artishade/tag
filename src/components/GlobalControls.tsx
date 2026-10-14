import React, { useState } from "react";
import { useMediaStore } from "../store/mediaStore";
import WatermarkControls from "./WatermarkControls";
import LogoUploader from "./LogoUploader";
import PreviewModal from "./PreviewModal";

const GlobalControls: React.FC = () => {
  const globalWatermark = useMediaStore((s) => s.globalWatermark);
  const globalLogo = useMediaStore((s) => s.globalLogo);
  const setGlobalWatermark = useMediaStore((s) => s.setGlobalWatermark);
  const setGlobalLogo = useMediaStore((s) => s.setGlobalLogo);
  const items = useMediaStore((s) => s.items);
  const selectedId = useMediaStore((s) => s.selectedId);
  const [showPreview, setShowPreview] = useState(false);

  const selectedItem = items.find((i) => i.id === selectedId);

  // Build a combined preview item from global settings + selected item's media
  const combinedItem = selectedItem
    ? {
        ...selectedItem,
        watermark: { ...selectedItem.watermark, ...globalWatermark },
        logo: {
          ...selectedItem.logo,
          ...globalLogo,
          dataUrl: globalLogo.dataUrl ?? selectedItem.logo.dataUrl,
          file: globalLogo.file ?? selectedItem.logo.file,
        },
      }
    : null;

  return (
    <div className="mb-8 bg-white rounded-xl shadow border p-4">
      <h2 className="text-lg font-semibold text-gray-800 mb-3">
        Global Settings (apply to new uploads)
      </h2>
      <p className="text-xs text-gray-500 mb-3">
        These settings are applied to all new uploads. Use "Apply to All" on
        individual items to update existing media.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WatermarkControls
          watermark={{
            text: globalWatermark.text ?? "",
            fontSize: globalWatermark.fontSize ?? 48,
            opacity: globalWatermark.opacity ?? 0.5,
            color: globalWatermark.color ?? "#ffffff",
            position: globalWatermark.position ?? "bottom-right",
            customX: globalWatermark.customX,
            customY: globalWatermark.customY,
          }}
          onChange={setGlobalWatermark}
        />

        <LogoUploader
          logo={{
            file: globalLogo.file ?? null,
            dataUrl: globalLogo.dataUrl ?? null,
            scale: globalLogo.scale ?? 0.2,
            opacity: globalLogo.opacity ?? 0.7,
            position: globalLogo.position ?? "top-right",
            customX: globalLogo.customX,
            customY: globalLogo.customY,
            rotation: globalLogo.rotation ?? 0,
          }}
          onChange={setGlobalLogo}
        />
      </div>

      {/* Preview button for global settings */}
      {selectedItem && (selectedItem.watermark.text || selectedItem.logo.file) && (
        <div className="mt-4 pt-3 border-t">
          <button
            onClick={() => setShowPreview(true)}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            title="Preview how global settings will look on the selected media"
          >
            👁️ Preview Global Settings on "{selectedItem.file.name}"
          </button>
        </div>
      )}

      {showPreview && combinedItem && (
        <PreviewModal item={combinedItem} onClose={() => setShowPreview(false)} />
      )}
    </div>
  );
};

export default GlobalControls;
