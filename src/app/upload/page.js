'use client'; // Add this directive at the top

import { useState, useCallback } from 'react';
import axios from 'axios';

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState(null);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type.startsWith('audio/')) {
        setFile(droppedFile);
        setError(null);
      } else {
        setError('Please upload an audio file (MP3, WAV, etc.)');
      }
    }
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type.startsWith('audio/')) {
        setFile(selectedFile);
        setError(null);
      } else {
        setError('Please upload an audio file (MP3, WAV, etc.)');
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    const formData = new FormData();
    formData.append('music', file);

    try {
      const response = await axios.post(
        process.env.NEXT_PUBLIC_API_URL + '/api/upload', 
        formData,
        {
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(percentCompleted);
          },
        }
      );

      setUploadResult(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Music Uploader</h1>
      
      <div 
        className="border-2 border-dashed border-gray-400 rounded-lg p-8 text-center mb-4"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {file ? (
          <div className="mb-4">
            <p className="text-lg">Selected file: {file.name}</p>
            <p className="text-sm text-gray-600">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
          </div>
        ) : (
          <>
            <p className="text-lg mb-2">Drag & drop your music file here</p>
            <p className="text-gray-600 mb-4">or</p>
            <input
              type="file"
              id="file-upload"
              accept="audio/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <label
              htmlFor="file-upload"
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded cursor-pointer"
            >
              Select File
            </label>
          </>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {file && !isUploading && !uploadResult && (
        <button
          onClick={handleUpload}
          className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded"
          disabled={isUploading}
        >
          Upload
        </button>
      )}

      {isUploading && (
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          <p className="text-center mt-2">
            Uploading: {uploadProgress}%
          </p>
        </div>
      )}

      {uploadResult && (
        <div className="mt-6 p-4 bg-green-100 border border-green-400 rounded">
          <h2 className="text-xl font-semibold mb-2">Upload Successful!</h2>
          <p className="mb-2">Your music is now available at:</p>
          <a
            href={uploadResult.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline break-all"
          >
            {uploadResult.url}
          </a>
          
          <div className="mt-4">
            <h3 className="font-semibold">Audio Player:</h3>
            <audio controls className="w-full mt-2">
              <source src={uploadResult.url} type={`audio/${uploadResult.filename.split('.').pop()}`} />
              Your browser does not support the audio element.
            </audio>
          </div>
        </div>
      )}
    </div>
  );
}