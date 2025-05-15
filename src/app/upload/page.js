'use client';
import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [musicList, setMusicList] = useState([]);
  const [copiedIndex, setCopiedIndex] = useState(null);

  // Fetch existing music files on component mount
  useEffect(() => {
    const fetchMusicList = async () => {
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/music`);
        setMusicList(response.data);
      } catch (err) {
        console.error('Error fetching music list:', err);
      }
    };
    fetchMusicList();
  }, []);

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

  // const handleFileChange = (e) => {
  //   if (e.target.files && e.target.files[0]) {
  //     const selectedFile = e.target.files[0];
  //     if (selectedFile.type.startsWith('audio/')) {
  //       setFile(selectedFile);
  //       setError(null);
  //     } else {
  //       setError('Please upload an audio file (MP3, WAV, etc.)');
  //     }
  //   }
  // };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const maxSize = 150 * 1024 * 1024; // 150MB

      if (selectedFile.size > maxSize) {
        setError('File size exceeds 50MB limit');
        return;
      }

      if (selectedFile.type.startsWith('audio/')) {
        setFile(selectedFile);
        setError(null);
      } else {
        setError('Please upload an audio file (MP3, WAV, M4A, etc.)');
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
        `${process.env.NEXT_PUBLIC_API_URL}/api/upload`,
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

      // Add new music to the list
      setMusicList(prev => [response.data, ...prev]);
      setFile(null); // Reset file input
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6 text-center">Music Uploader</h1>

      {/* Upload Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-4 hover:border-blue-400 transition-colors cursor-pointer"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-upload').click()}
        >
          {file ? (
            <div className="mb-4">
              <p className="text-lg font-medium">Selected file: {file.name}</p>
              <p className="text-sm text-gray-600">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
            </div>
          ) : (
            <>
              <div className="flex flex-col items-center justify-center space-y-2">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-lg font-medium">Drag & drop your music file here</p>
                <p className="text-gray-500">or</p>
                <span className="text-blue-500 font-medium">click to browse files</span>
                <p className="text-xs text-gray-400 mt-2">Supports: MP3, WAV</p>
              </div>
            </>
          )}
        </div>

        <input
          type="file"
          id="file-upload"
          accept="audio/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {file && !isUploading && (
          <button
            onClick={handleUpload}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
            disabled={isUploading}
          >
            Upload Music
          </button>
        )}

        {isUploading && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-center mt-2 text-sm text-gray-600">
              Uploading: {uploadProgress}%
            </p>
          </div>
        )}
      </div>

      {/* Music List Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Uploaded Music</h2>

        {musicList.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No music files uploaded yet</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {musicList.map((music, index) => (
              <li key={music.url} className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {music.filename || music.url.split('/').pop()}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {music.url}
                    </p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(music.url, index)}
                    className="ml-4 inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    {copiedIndex === index ? 'Copied!' : 'Copy URL'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
