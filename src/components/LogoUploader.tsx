import React, { useCallback } from "react";
import { LogoSettings } from "../store/mediaStore";

interface LogoUploaderProps {
  logo: LogoSettings;
  onChange: (patch: Partial<LogoSettings>) => void;
}

const POSITION_OPTIONS = [
  { value: "top-left", label: "↖ Top Left" },
  { value: "top-right", label: "↗ Top Right" },
  { value: "center", label: "⊙ Center" },
  { value: "bottom-left", label: "↙ Bottom Left" },
  { value: "bottom-right", label: "↘ Bottom Right" },
] as const;

const LogoUploader: React.FC<LogoUploaderProps> = ({ logo, onChange }) => {
  const handleLogoUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        alert("Please upload an image file (PNG, JPG, etc.)");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert("Logo file size limit: 5MB");
        return;
      }

      onChange({ file, dataUrl: null });
    },
    [onChange]
  );

  const handleRemoveLogo = () => {
    onChange({ file: null, dataUrl: null });
  };

  const handleScaleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ scale: Number(e.target.value) });
  };

  const handleOpacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ opacity: Number(e.target.value) });
  };

  const handleRotationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ rotation: Number(e.target.value) });
  };

  const handlePositionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ position: e.target.value as LogoSettings["position"] });
  };

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold text-gray-600 uppercase">
        Logo Overlay
      </h4>

      {/* Logo upload / display */}
      <div>
        {!logo.dataUrl ? (
          <label className="flex items-center justify-center px-3 py-4 text-sm text-gray-600 bg-gray-50 border border-gray-300 rounded cursor-pointer hover:bg-gray-100">
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16V5a2 2 0 012-2h6a2 2 0 012 2v11m-4 4h.01M12 19h.01M7 19h.01M4 15h16"
              />
            </svg>
            Upload Logo
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />
          </label>
        ) : (
          <div className="flex items-center gap-2">
            <img
              src={logo.dataUrl}
              alt="logo"
              className="w-12 h-12 object-cover rounded border"
            />
            <button
              onClick={handleRemoveLogo}
              className="text-xs text-red-600 hover:text-red-800"
              title="Remove logo"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {logo.dataUrl && (
        <>
          {/* Scale */}
          <div>
            <label className="block text-xs text-gray-600 mb-1">
              Scale: {Math.round(logo.scale * 100)}%
            </label>
            <input
              type="range"
              min="0.05"
              max="1"
              step="0.05"
              value={logo.scale}
              onChange={handleScaleChange}
              className="w-full"
            />
          </div>

          {/* Opacity */}
          <div>
            <label className="block text-xs text-gray-600 mb-1">
              Opacity: {Math.round(logo.opacity * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={logo.opacity}
              onChange={handleOpacityChange}
              className="w-full"
            />
          </div>

          {/* Rotation */}
          <div>
            <label className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Rotation: {logo.rotation}°</span>
            </label>
            <input
              type="range"
              min="0"
              max="360"
              step="5"
              value={logo.rotation}
              onChange={handleRotationChange}
              className="w-full"
            />
          </div>

          {/* Position */}
          <div>
            <label className="block text-xs text-gray-600 mb-1">Position</label>
            <select
              value={logo.position}
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
        </>
      )}
    </div>
  );
};

export default LogoUploader;
