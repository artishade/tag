import React from "react";
import "./App.css";
import UploadZone from "./components/UploadZone";
import MediaGrid from "./components/MediaGrid";
import DownloadSection from "./components/DownloadSection";
import GlobalControls from "./components/GlobalControls";
import { useMediaStore } from "./store/mediaStore";

const App: React.FC = () => {
  const items = useMediaStore((s) => s.items);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Tag</h1>
          <p className="text-sm text-gray-500 mt-1">
            Drag &amp; drop media, add watermarks + logos, download processed files.
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <UploadZone />
        <GlobalControls />
        {items.length > 0 && <MediaGrid />}
      </main>

      {items.length > 0 && items.some((i) => i.processedUrl) && <DownloadSection />}
    </div>
  );
};

export default App;
