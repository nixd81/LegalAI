import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const DragDropUpload = ({ onFileSelect, loading = false }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  const fileInputRef = useRef(null);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev + 1);
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev - 1);
    if (dragCounter === 1) {
      setIsDragOver(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    setDragCounter(0);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
          transition-colors duration-150
          ${isDragOver 
            ? 'border-amber-500 bg-gray-400' 
            : 'border-slate-500 hover:border-amber-500/50 bg-gray-400'
          }
          ${loading ? 'pointer-events-none opacity-60' : ''}
        `}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={openFileDialog}
        whileHover={{}}
        whileTap={{}}
      >
        {/* Upload Icon */}
        <div className="mb-4">
          <div className="w-14 h-14 mx-auto mb-3 rounded-md bg-amber-600 text-white flex items-center justify-center">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
        </div>

        {/* Upload Text */}
        <motion.div
          className="relative z-10"
          animate={isDragOver ? { scale: 1.05 } : {}}
        >
          <h3 className="text-xl font-semibold text-white mb-2">
            {isDragOver ? 'Drop your file here' : 'Upload legal document'}
          </h3>
          <p className="text-gray-300 mb-3">
            Drag and drop your PDF or DOCX, or click to browse
          </p>
          <p className="text-sm text-gray-400">
            Supports: PDF, DOCX, DOC, PNG, JPG, JPEG
          </p>
        </motion.div>

        {/* Subtle hover handled by border color only */}

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.docx,.doc,.png,.jpg,.jpeg"
          onChange={handleFileInput}
        />
      </motion.div>

      {/* Loading Overlay */}
      <AnimatePresence>
        {loading && (
          <motion.div
            className="absolute inset-0 bg-white/70 rounded-xl flex items-center justify-center z-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="text-center">
              <div className="w-10 h-10 border-4 border-slate-300 border-t-slate-900 rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-white font-medium">Processing document...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default DragDropUpload;


