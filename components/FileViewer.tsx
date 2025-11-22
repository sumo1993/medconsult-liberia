'use client';

import { useState } from 'react';
import { X, Download, FileText, Image as ImageIcon } from 'lucide-react';

interface FileViewerProps {
  fileUrl: string;
  filename: string;
  fileType: string;
  onClose: () => void;
}

export default function FileViewer({ fileUrl, filename, fileType, onClose }: FileViewerProps) {
  const [loading, setLoading] = useState(true);

  const isPDF = fileType === 'application/pdf' || filename.endsWith('.pdf');
  const isImage = fileType.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(filename);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-3">
            {isPDF ? (
              <FileText className="text-red-600" size={24} />
            ) : isImage ? (
              <ImageIcon className="text-blue-600" size={24} />
            ) : (
              <FileText className="text-gray-600" size={24} />
            )}
            <div>
              <h3 className="font-semibold text-gray-900">{filename}</h3>
              <p className="text-xs text-gray-500">{fileType}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownload}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Download size={18} />
              <span>Download</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden relative bg-gray-100">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}

          {isPDF && (
            <iframe
              src={fileUrl}
              className="w-full h-full"
              onLoad={() => setLoading(false)}
              title={filename}
            />
          )}

          {isImage && (
            <div className="w-full h-full flex items-center justify-center p-4">
              <img
                src={fileUrl}
                alt={filename}
                className="max-w-full max-h-full object-contain"
                onLoad={() => setLoading(false)}
              />
            </div>
          )}

          {!isPDF && !isImage && (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <FileText className="mx-auto text-gray-400 mb-4" size={64} />
                <p className="text-gray-600 mb-4">Preview not available for this file type</p>
                <button
                  onClick={handleDownload}
                  className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Download File
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
