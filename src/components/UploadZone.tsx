import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useMediaStore } from "../store/mediaStore";

const MAX_FILES = 50;
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB per file

interface UploadZoneProps {
  onUpload?: () => void;
}

// Inline SVG icons (no extra dependency needed)
const UploadIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M12 3l7 7h-2v6h-2v-6H9v6H7v-6H5z" />
  </svg>
);

const ImageIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <path d="M21 15l-5-5-5 5" />
  </svg>
);

const VideoIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 16v-4a2 2 0 0 0-2-2H3a2 2 0 0 0-2 2v4" />
    <path d="M22 16l-3-1v-2l3-1v4z" />
  </svg>
);

const UploadZone: React.FC<UploadZoneProps> = ({ onUpload }) => {
  const addFiles = useMediaStore((s) => s.addFiles);
  const itemCount = useMediaStore((s) => s.items.length);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      // Filter out unsupported files
      const validFiles = acceptedFiles.filter(
        (file) => file.type.startsWith("image/") || file.type.startsWith("video/")
      );

      if (validFiles.length === 0) {
        alert("Please upload image or video files only.");
        return;
      }

      // Check per-file size
      const oversized = validFiles.filter((f) => f.size > MAX_FILE_SIZE);
      if (oversized.length > 0) {
        alert(`File size limit exceeded. Max ${MAX_FILE_SIZE / (1024 * 1024)}MB per file.`);
        return;
      }

      // Check total file count
      if (itemCount + validFiles.length > MAX_FILES) {
        alert(`Maximum ${MAX_FILES} files allowed.`);
        return;
      }

      addFiles(validFiles);
      onUpload?.();
    },
    [addFiles, itemCount, onUpload]
  );

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragReject,
    fileRejections,
  } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".tiff", ".svg"],
      "video/*": [".mp4", ".webm", ".avi", ".mov", ".mkv", ".wmv"],
    },
    maxFiles: MAX_FILES,
    multiple: true,
  });

  return (
    <div className="mb-8">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
          isDragActive
            ? "border-blue-500 bg-blue-50 scale-105"
            : isDragReject
            ? "border-red-500 bg-red-50"
            : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center gap-4">
          {isDragActive ? (
            <UploadIcon className="w-12 h-12 text-blue-500 animate-bounce" />
          ) : (
            <>
              <div className="flex gap-4">
                <ImageIcon className="w-8 h-8 text-gray-400" />
                <VideoIcon className="w-8 h-8 text-gray-400" />
              </div>
              <UploadIcon className="w-16 h-16 text-gray-300" />
            </>
          )}
          <div>
            <p className="text-lg font-medium text-gray-700">
              {isDragActive
                ? "Drop your media files here..."
                : "Drag & drop media files, or click to browse"}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Images & videos up to 100MB each — {itemCount}/{MAX_FILES} uploaded
            </p>
          </div>
        </div>
      </div>

      {fileRejections.length > 0 && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600 font-medium">Some files were rejected:</p>
          <ul className="list-disc list-inside text-sm text-red-500 mt-1">
            {fileRejections.map(({ file, errors }) => (
              <li key={file.path}>
                {file.path} — {errors[0]?.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default UploadZone;
