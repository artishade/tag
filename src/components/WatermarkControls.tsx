import React from "react";
import { WatermarkSettings } from "../store/mediaStore";

interface WatermarkControlsProps {
  watermark: WatermarkSettings;
  onChange: (patch: Partial<WatermarkSettings>) => void;
}

const POSITION_OPTIONS = [
  { value: "top-left", label: "↖ Top Left" },
  { value: "top-right", label: "↗ Top Right" },
  { value: "center", label: "⊙ Center" },
  { value: "bottom-left", label: "↙ Bottom Left" },
  { value: "bottom-right", label: "↘ Bottom Right" },
] as const;

const WatermarkControls: React.FC<WatermarkControlsProps> = ({
  watermark,
  onChange,
}) => {
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ text: e.target.value });
  };

  const handleFontSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ fontSize: Number(e.target.value) });
  };

  const handleOpacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ opacity: Number(e.target.value) });
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ color: e.target.value });
  };

  const handlePositionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ position: e.target.value as WatermarkSettings["position"] });
  };

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold text-gray-600 uppercase">
        Text Watermark
      </h4>

      {/* Text input */}
      <div>
        <label className="block text-xs text-gray-600 mb-1">Watermark Text</label>
        <input
          type="text"
          value={watermark.text}
          onChange={handleTextChange}
          placeholder="Enter watermark text..."
          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Font size */}
      <div>
        <label className="block text-xs text-gray-600 mb-1">
          Font Size: {watermark.fontSize}px
        </label>
        <input
          type="range"
          min="8"
          max="200"
          value={watermark.fontSize}
          onChange={handleFontSizeChange}
          className="w-full"
        />
      </div>

      {/* Opacity */}
      <div>
        <label className="block text-xs text-gray-600 mb-1">
          Opacity: {Math.round(watermark.opacity * 100)}%
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={watermark.opacity}
          onChange={handleOpacityChange}
          className="w-full"
        />
      </div>

      {/* Color */}
      <div className="flex items-center gap-2">
        <label className="text-xs text-gray-600 whitespace-nowrap">Color:</label>
        <input
          type="color"
          value={watermark.color}
          onChange={handleColorChange}
          className="w-8 h-6 p-0 border border-gray-300 rounded cursor-pointer"
        />
        <input
          type="text"
          value={watermark.color}
          onChange={handleColorChange}
          className="flex-1 text-xs px-2 py-1 border border-gray-300 rounded"
        />
      </div>

      {/* Position */}
      <div>
        <label className="block text-xs text-gray-600 mb-1">Position</label>
        <select
          value={watermark.position}
          onChange={handlePositionChange}
          className="w-full text-sm px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {POSITION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Live preview of the watermark text */}
      {watermark.text && (
        <div
          className="p-3 bg-gray-50 rounded text-center"
          style={{ color: watermark.color, fontSize: `${watermark.fontSize}px` }}
        >
          {watermark.text}
        </div>
      )}
    </div>
  );
};

export default WatermarkControls;
