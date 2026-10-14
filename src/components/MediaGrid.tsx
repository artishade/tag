import React from "react";
import { useMediaStore } from "../store/mediaStore";
import MediaItem from "./MediaItem";

interface MediaGridProps {}

const MediaGrid: React.FC<MediaGridProps> = () => {
  const items = useMediaStore((s) => s.items);
  const selectedId = useMediaStore((s) => s.selectedId);
  const setSelectedId = useMediaStore((s) => s.setSelectedId);

  const selectedItem = items.find((i) => i.id === selectedId);

  return (
    <section>
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Uploaded Media</h2>

      {items.length === 0 ? (
        <p className="text-gray-500">No files uploaded yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((item) => (
            <MediaItem
              key={item.id}
              item={item}
              isSelected={item.id === selectedId}
              onSelect={() => setSelectedId(item.id)}
            />
          ))}
        </div>
      )}

      {selectedItem && (
        <div className="mt-6 p-4 bg-white rounded-lg shadow border">
          <h3 className="text-sm font-medium text-gray-700">
            Selected: {selectedItem.file.name} ({selectedItem.type})
          </h3>
        </div>
      )}
    </section>
  );
};

export default MediaGrid;
