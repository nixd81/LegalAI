import React from 'react';
import { motion } from 'framer-motion';
import DragDropUpload from '../DragDropUpload';
import { useWizard } from '../WizardContext';

const UploadStep = () => {
  const { 
    file, 
    setFile, 
    query, 
    setQuery, 
    loading, 
    setLoading, 
    setText, 
    setSummary, 
    setRisk, 
    setClauses,
    goToNext 
  } = useWizard();

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("query", query);
    formData.append("clauses", JSON.stringify([]));

    try {
      const res = await fetch("http://localhost:8000/upload/", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setText(data.extracted_text || data.error);
      setSummary(data.ai_summary || "");
      setRisk(data.risk || "green");
      setClauses(data.clauses || []);
      setLoading(false);
      
      // Auto-advance to next step after successful upload
      setTimeout(() => {
        goToNext();
      }, 1000);
    } catch (error) {
      console.error('Upload error:', error);
      setLoading(false);
    }
  };

  const handleSampleFile = () => {
    const sampleContent = `SAMPLE LEGAL CONTRACT

This is a sample employment agreement for demonstration purposes.

SECTION 1: EMPLOYMENT TERMS
The Employee agrees to work for the Company for a period of 2 years, starting from the date of signing this agreement.

SECTION 2: COMPENSATION
The Employee will receive a salary of $75,000 per year, paid monthly.

SECTION 3: TERMINATION
Either party may terminate this agreement with 30 days written notice.

SECTION 4: CONFIDENTIALITY
The Employee agrees to keep all company information confidential.

This is a sample document to demonstrate the AI analysis capabilities.`;
    
    const blob = new Blob([sampleContent], { type: 'text/plain' });
    const sampleFile = new File([blob], 'sample-contract.txt', { type: 'text/plain' });
    setFile(sampleFile);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl font-bold text-white mb-4">
          Upload Document
        </h1>
        <p className="text-lg text-gray-300 max-w-2xl mx-auto">
          Upload your legal document for AI analysis. Supports PDF, Word, and images.
        </p>
      </motion.div>

      {/* Upload Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="bg-gray-800/50 rounded-lg p-8 mb-8"
      >
        {/* Query Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Specific Question (Optional)
          </label>
          <input
            type="text"
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., 'What are the termination clauses?'"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        
        {/* Drag & Drop Upload */}
        <div className="mb-6">
          <DragDropUpload onFileSelect={setFile} loading={loading} />
        </div>

        {/* Sample File Option */}
        <div className="text-center mb-6">
          <p className="text-gray-400 mb-3">Don't have a document? Try our sample:</p>
          <motion.button
            onClick={handleSampleFile}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors duration-200"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Use Sample Contract
          </motion.button>
        </div>
        
        {/* Upload Button */}
        <motion.button
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-md font-medium transition-colors duration-200"
          onClick={handleUpload}
          disabled={!file || loading}
          whileHover={!loading ? { scale: 1.02 } : {}}
          whileTap={!loading ? { scale: 0.98 } : {}}
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3"></div>
              Processing...
            </div>
          ) : (
            "Upload & Analyze"
          )}
        </motion.button>
      </motion.div>

      {/* File Info */}
      {file && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-gray-800/50 rounded-lg p-6 mb-8"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-white font-medium">{file.name}</h3>
              <p className="text-gray-400 text-sm">
                {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type || 'Unknown type'}
              </p>
            </div>
            <button
              onClick={() => setFile(null)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default UploadStep;
