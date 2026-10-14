import { create } from "zustand";
import { devtools } from "zustand/middleware";

export type MediaType = "image" | "video";
export type MediaStatus = "idle" | "processing" | "done" | "error";

export interface WatermarkSettings {
  text: string;
  fontSize: number; // px
  opacity: number; // 0–1
  color: string; // hex
  position: "top-left" | "top-right" | "center" | "bottom-left" | "bottom-right";
  // custom positioning (drag)
  customX?: number; // 0–1 relative to width
  customY?: number; // 0–1 relative to height
}

export interface LogoSettings {
  file: File | null;
  dataUrl: string | null; // preview
  scale: number; // 0.1–2 relative to media width
  opacity: number; // 0–1
  position: "top-left" | "top-right" | "center" | "bottom-left" | "bottom-right";
  customX?: number;
  customY?: number;
  rotation: number; // degrees
}

export interface MediaItem {
  id: string;
  file: File;
  url: string; // object URL for preview
  type: MediaType;
  status: MediaStatus;
  processedUrl: string | null;
  watermark: WatermarkSettings;
  logo: LogoSettings;
}

export interface MediaStore {
  items: MediaItem[];
  selectedId: string | null;
  // Global settings — new items inherit these, and "Apply to All" overwrites items with these
  globalWatermark: Partial<WatermarkSettings>;
  globalLogo: Partial<LogoSettings>;
  addFiles: (files: File[]) => void;
  removeFile: (id: string) => void;
  updateWatermark: (id: string, patch: Partial<WatermarkSettings>) => void;
  updateLogo: (id: string, patch: Partial<LogoSettings>) => void;
  setProcessedUrl: (id: string, url: string | null) => void;
  setStatus: (id: string, status: MediaStatus) => void;
  setSelectedId: (id: string | null) => void;
  setGlobalWatermark: (patch: Partial<WatermarkSettings>) => void;
  setGlobalLogo: (patch: Partial<LogoSettings>) => void;
  applyToAll: (type: "watermark" | "logo" | "both", fromId: string) => void;
  clearAll: () => void;
}

const DEFAULT_WATERMARK: WatermarkSettings = {
  text: "",
  fontSize: 48,
  opacity: 0.5,
  color: "#ffffff",
  position: "bottom-right",
};

const DEFAULT_LOGO: LogoSettings = {
  file: null,
  dataUrl: null,
  scale: 0.2,
  opacity: 0.7,
  position: "top-right",
  rotation: 0,
};

const getMediaType = (file: File): MediaType => {
  return file.type.startsWith("video/") ? "video" : "image";
};

const getPositionPercent = (
  position: WatermarkSettings["position"],
  customX?: number,
  customY?: number
): [number, number] => {
  if (customX !== undefined && customY !== undefined) {
    return [customX, customY];
  }
  switch (position) {
    case "top-left":
      return [0.05, 0.05];
    case "top-right":
      return [0.95, 0.05];
    case "center":
      return [0.5, 0.5];
    case "bottom-left":
      return [0.05, 0.95];
    case "bottom-right":
    default:
      return [0.95, 0.95];
  }
};

export { getMediaType, getPositionPercent };

export const useMediaStore = create<MediaStore>()(
  devtools(
    (set) => ({
      items: [],
      selectedId: null,
      globalWatermark: {},
      globalLogo: {},

      addFiles: (files: File[]) =>
        set((state) => {
          const newItems = files.map((file) => {
            const id = crypto.randomUUID();
            const url = URL.createObjectURL(file);
            return {
              id,
              file,
              url,
              type: getMediaType(file),
              status: "idle" as MediaStatus,
              processedUrl: null,
              watermark: { ...DEFAULT_WATERMARK, ...state.globalWatermark },
              logo: { ...DEFAULT_LOGO, ...state.globalLogo },
            };
          });
          return {
            items: [...state.items, ...newItems],
            selectedId: newItems[0]?.id ?? state.selectedId,
          };
        }),

      removeFile: (id: string) =>
        set((state) => {
          const item = state.items.find((i) => i.id === id);
          if (item) {
            URL.revokeObjectURL(item.url);
            if (item.processedUrl) URL.revokeObjectURL(item.processedUrl);
          }
          return {
            items: state.items.filter((i) => i.id !== id),
            selectedId:
              state.selectedId === id
                ? state.items.filter((i) => i.id !== id)[0]?.id ?? null
                : state.selectedId,
          };
        }),

      updateWatermark: (id, patch) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id ? { ...i, watermark: { ...i.watermark, ...patch } } : i
          ),
        })),

      updateLogo: (id, patch) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id
              ? {
                  ...i,
                  logo: {
                    ...i.logo,
                    ...patch,
                    dataUrl:
                      patch.file !== undefined
                        ? patch.file
                          ? URL.createObjectURL(patch.file)
                          : null
                        : patch.dataUrl !== undefined
                        ? patch.dataUrl
                        : i.logo.dataUrl,
                  },
                }
              : i
          ),
        })),

      setProcessedUrl: (id, url) =>
        set((state) => ({
          items: state.items.map((i) => (i.id === id ? { ...i, processedUrl: url } : i)),
        }), false, "setProcessedUrl"),

      setStatus: (id, status) =>
        set((state) => ({
          items: state.items.map((i) => (i.id === id ? { ...i, status } : i)),
        })),

      setSelectedId: (id) => set({ selectedId: id }),

      setGlobalWatermark: (patch) =>
        set((state) => ({
          globalWatermark: { ...state.globalWatermark, ...patch },
        })),

      setGlobalLogo: (patch) =>
        set((state) => {
          const current = state.globalLogo;
          let dataUrl: string | null;
          if (patch.file !== undefined) {
            dataUrl = patch.file ? URL.createObjectURL(patch.file) : null;
          } else if (patch.dataUrl !== undefined) {
            dataUrl = patch.dataUrl;
          } else {
            dataUrl = current.dataUrl ?? null;
          }
          return {
            globalLogo: {
              ...current,
              ...patch,
              dataUrl,
            },
          };
        }),

      applyToAll: (type, fromId) =>
        set((state) => {
          const item = state.items.find((i) => i.id === fromId);
          if (!item) return state;
          return {
            items: state.items.map((i) => {
              if (i.id === fromId) return i;
              const updated = { ...i };
              if (type === "watermark" || type === "both") {
                updated.watermark = { ...item.watermark };
              }
              if (type === "logo" || type === "both") {
                updated.logo = { ...item.logo };
              }
              return updated;
            }),
          };
        }),

      clearAll: () =>
        set((state) => {
          state.items.forEach((i) => {
            URL.revokeObjectURL(i.url);
            if (i.processedUrl) URL.revokeObjectURL(i.processedUrl);
            if (i.logo.dataUrl) URL.revokeObjectURL(i.logo.dataUrl);
          });
          // Revoke global logo dataUrl
          if (state.globalLogo.dataUrl) {
            URL.revokeObjectURL(state.globalLogo.dataUrl);
          }
          return { items: [], selectedId: null, globalWatermark: {}, globalLogo: {} };
        }),
    }),
    { name: "media-store" }
  )
);
